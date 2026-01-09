from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from uuid import uuid4
from app.services.gemini_client import gemini_client
from app.services.supabase_vector import vector_store
from app.database import supabase

router = APIRouter(prefix="/api/v1", tags=["queries"])

class QueryRequest(BaseModel):
    question: str
    document_ids: list[str]
    search_limit: int = 5

@router.post("/query")
async def query_documents(
    req: QueryRequest,
    x_user_id: str = Header(..., description="User ID from frontend")
):
    """Ask a question about documents"""
    try:
        query_id = str(uuid4())

        # Generate embedding for the question
        question_embedding = gemini_client.embed_text(req.question)

        # Search for similar chunks using vector similarity
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

        # Build context from search results
        context = "\n\n".join([
            f"[Sayfa {r['page_number']}]\n{r['chunk_text']}"
            for r in search_results
        ])

        # Generate answer using Gemini
        answer = await gemini_client.generate_answer(
            question=req.question,
            context=context
        )

        # Store query in database
        supabase.table("queries").insert({
            "id": query_id,
            "user_id": x_user_id,
            "question": req.question
        }).execute()

        # Format sources
        sources = [
            {
                "document_id": r['document_id'],
                "page_number": r['page_number'],
                "similarity": round(r['similarity'], 3)
            }
            for r in search_results
        ]

        return {
            "query_id": query_id,
            "question": req.question,
            "answer": answer,
            "sources": sources
        }
    except Exception as e:
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
