from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from uuid import uuid4
from typing import Optional, List
from app.services.embedding_client import embedding_client
from app.services.ollama_client import ollama_client
from app.services.supabase_vector import vector_store
from app.database import supabase

router = APIRouter(prefix="/api/v1", tags=["queries"])


class QueryRequest(BaseModel):
    question: str
    document_ids: list[str]
    search_limit: int = 5


class KeywordSearchRequest(BaseModel):
    query: str
    document_id: str
    limit: int = 10


@router.post("/query")
async def query_documents(
    req: QueryRequest,
    x_user_id: str = Header(..., description="User ID from frontend")
):
    """
    Ask a question about documents using semantic search.

    Returns answer with detailed source attribution including:
    - document_id and title
    - chunk_id and chunk_index
    - page number (for PDFs)
    - line_start/line_end (for text files)
    - similarity score
    - chunk preview
    """
    try:
        print(f"[query] Received question: {req.question}")
        print(f"[query] Document IDs: {req.document_ids}")

        query_id = str(uuid4())

        # Check if all documents are ready
        for doc_id in req.document_ids:
            doc = vector_store.get_document(doc_id)
            if not doc:
                raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
            if doc['status'] != 'ready':
                raise HTTPException(
                    status_code=400,
                    detail=f"Document '{doc['filename']}' is still processing. Please wait."
                )

        # Generate embedding for the question (LOCAL - fast!)
        question_embedding = embedding_client.embed_text(req.question)
        print(f"[query] Embedding generated, length: {len(question_embedding)}")

        # Search for similar chunks
        search_results = await vector_store.vector_search(
            query_embedding=question_embedding,
            document_ids=req.document_ids,
            limit=req.search_limit
        )

        if not search_results:
            return {
                "query_id": query_id,
                "question": req.question,
                "answer": "Sağlanan belgelerde bu soruya cevap verebilecek bilgi bulunamadı.",
                "sources": []
            }

        # Get document titles for sources
        doc_titles = {}
        for doc_id in req.document_ids:
            doc = vector_store.get_document(doc_id)
            if doc:
                doc_titles[doc_id] = doc['filename']

        # Build context from search results with location info
        context_parts = []
        for r in search_results:
            location_info = ""
            if r.get('page_number') is not None:
                location_info = f"Sayfa {r['page_number']}"
            elif r.get('line_start') is not None:
                location_info = f"Satır {r['line_start']}-{r['line_end']}"
            else:
                location_info = f"Bölüm {r.get('chunk_index', r.get('chunk_number', 0))}"

            context_parts.append(f"[{location_info}]\n{r['chunk_text']}")

        context = "\n\n".join(context_parts)

        print(f"[query] Context built, length: {len(context)} chars")
        print(f"[query] Calling Ollama...")

        # Generate answer using Ollama (LOCAL!)
        answer = await ollama_client.generate_answer(
            question=req.question,
            context=context
        )
        print(f"[query] Ollama response received: {answer[:100]}...")

        # Store query in database
        supabase.table("queries").insert({
            "id": query_id,
            "user_id": x_user_id,
            "question": req.question
        }).execute()

        # Format detailed sources with previews
        sources = []
        for r in search_results:
            chunk_text = r.get('chunk_text', '')
            preview = chunk_text[:200] + "..." if len(chunk_text) > 200 else chunk_text

            sources.append({
                "document_id": r['document_id'],
                "title": doc_titles.get(r['document_id'], 'Unknown'),
                "chunk_id": str(r['id']),
                "chunk_index": r.get('chunk_index', r.get('chunk_number', 0)),
                "page": r.get('page_number'),
                "line_start": r.get('line_start'),
                "line_end": r.get('line_end'),
                "similarity": round(r.get('similarity', 0), 3),
                "preview": preview
            })

        return {
            "query_id": query_id,
            "question": req.question,
            "answer": answer,
            "sources": sources
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[query] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/keyword")
async def keyword_search(
    document_id: str = Query(..., description="Document ID to search in"),
    q: str = Query(..., description="Keyword to search for"),
    limit: int = Query(10, description="Maximum number of results"),
    x_user_id: str = Header(...)
):
    """
    Search for a keyword in document chunks using ILIKE matching.

    Returns matching chunks with location information.
    """
    try:
        print(f"[keyword] Searching for '{q}' in document {document_id[:8]}...")

        # Check document exists and user has access
        doc = vector_store.get_document(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        if doc['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        if doc['status'] != 'ready':
            raise HTTPException(
                status_code=400,
                detail=f"Document is still processing. Status: {doc['status']}"
            )

        # Perform keyword search
        results = await vector_store.keyword_search(
            document_id=document_id,
            query=q,
            limit=limit
        )

        # Format results with location info
        formatted_results = []
        for r in results:
            chunk_text = r.get('chunk_text', '')
            preview = chunk_text[:300] + "..." if len(chunk_text) > 300 else chunk_text

            # Highlight keyword in preview (simple implementation)
            import re
            pattern = re.compile(re.escape(q), re.IGNORECASE)
            highlighted_preview = pattern.sub(f"**{q}**", preview)

            formatted_results.append({
                "document_id": document_id,
                "title": doc['filename'],
                "chunk_id": str(r['id']),
                "chunk_index": r.get('chunk_index', r.get('chunk_number', 0)),
                "page": r.get('page_number'),
                "line_start": r.get('line_start'),
                "line_end": r.get('line_end'),
                "preview": highlighted_preview,
                "full_text": chunk_text
            })

        return {
            "query": q,
            "document_id": document_id,
            "document_title": doc['filename'],
            "results": formatted_results,
            "total": len(formatted_results)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[keyword] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search/keyword")
async def keyword_search_post(
    req: KeywordSearchRequest,
    x_user_id: str = Header(...)
):
    """
    Search for a keyword in document chunks (POST version).
    Same as GET but accepts body parameters.
    """
    try:
        print(f"[keyword] POST: Searching for '{req.query}' in document {req.document_id[:8]}...")

        # Check document exists and user has access
        doc = vector_store.get_document(req.document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        if doc['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        if doc['status'] != 'ready':
            raise HTTPException(
                status_code=400,
                detail=f"Document is still processing. Status: {doc['status']}"
            )

        # Perform keyword search
        results = await vector_store.keyword_search(
            document_id=req.document_id,
            query=req.query,
            limit=req.limit
        )

        # Format results
        formatted_results = []
        for r in results:
            chunk_text = r.get('chunk_text', '')
            preview = chunk_text[:300] + "..." if len(chunk_text) > 300 else chunk_text

            import re
            pattern = re.compile(re.escape(req.query), re.IGNORECASE)
            highlighted_preview = pattern.sub(f"**{req.query}**", preview)

            formatted_results.append({
                "document_id": req.document_id,
                "title": doc['filename'],
                "chunk_id": str(r['id']),
                "chunk_index": r.get('chunk_index', r.get('chunk_number', 0)),
                "page": r.get('page_number'),
                "line_start": r.get('line_start'),
                "line_end": r.get('line_end'),
                "preview": highlighted_preview,
                "full_text": chunk_text
            })

        return {
            "query": req.query,
            "document_id": req.document_id,
            "document_title": doc['filename'],
            "results": formatted_results,
            "total": len(formatted_results)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[keyword] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/queries")
async def list_queries(
    x_user_id: str = Header(...),
    limit: int = 10
):
    """List recent queries for a user"""
    try:
        response = supabase.table("queries").select("*").eq(
            "user_id", x_user_id
        ).order("created_at", desc=True).limit(limit).execute()

        return {
            "queries": response.data,
            "total": len(response.data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
