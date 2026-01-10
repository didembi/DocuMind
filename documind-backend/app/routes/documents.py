from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Query
from uuid import uuid4
from typing import Literal, Optional
from app.services.pdf_processor import pdf_processor
from app.services.embedding_client import embedding_client
from app.services.supabase_vector import vector_store
from app.services.ollama_client import ollama_client
from app.database import supabase

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    notebook_id: Optional[str] = Query(None, description="Notebook ID to associate document with"),
    x_user_id: str = Header(..., description="User ID from frontend")
):
    """Upload and process a document (PDF/TXT) with status management"""
    doc_id = str(uuid4())

    try:
        content = await file.read()

        # Basic file type validation
        is_pdf = content.startswith(b"%PDF")
        is_txt = file.filename.lower().endswith(".txt") or file.content_type == "text/plain"

        if not (is_pdf or is_txt):
            raise HTTPException(status_code=400, detail="Only PDF or TXT files are accepted")

        # Store document metadata with status=processing
        doc_data = {
            "id": doc_id,
            "user_id": x_user_id,
            "filename": file.filename,
            "file_size": len(content),
            "file_path": f"documents/{doc_id}.pdf" if is_pdf else f"documents/{doc_id}.txt",
            "status": "processing"  # Initially processing
        }
        if notebook_id:
            doc_data["notebook_id"] = notebook_id

        supabase.table("documents").insert(doc_data).execute()

        try:
            # Extract chunks with location metadata
            if is_txt:
                try:
                    text = content.decode("utf-8", errors="ignore")
                except Exception:
                    text = ""
                chunks = pdf_processor.extract_text_chunks(text, file.filename)
            else:
                chunks = pdf_processor.extract_chunks(content, file.filename)

            # Generate embeddings and store chunks (LOCAL - no rate limiting needed!)
            for chunk in chunks:
                try:
                    embedding = embedding_client.embed_text(chunk['text'])
                    vector_store.store_chunk(
                        document_id=doc_id,
                        chunk_text=chunk['text'],
                        chunk_number=chunk['chunk_number'],
                        page_number=chunk.get('page_number'),
                        embedding=embedding,
                        chunk_index=chunk.get('chunk_index'),
                        line_start=chunk.get('line_start'),
                        line_end=chunk.get('line_end')
                    )
                except Exception as e:
                    print(f"[upload] Chunk embedding error: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    # Mark as failed and re-raise
                    vector_store.update_document_status(doc_id, "failed")
                    raise HTTPException(status_code=500, detail=str(e))

            # Mark as ready after successful processing
            vector_store.update_document_status(doc_id, "ready")

            return {
                "id": doc_id,
                "filename": file.filename,
                "chunks_count": len(chunks),
                "status": "ready"
            }

        except HTTPException:
            raise
        except Exception as e:
            # Mark document as failed
            vector_store.update_document_status(doc_id, "failed")
            raise HTTPException(status_code=500, detail=str(e))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_documents(x_user_id: str = Header(...)):
    """List all documents for a user with status"""
    try:
        response = supabase.table("documents").select(
            "id, filename, file_size, status, short_summary, long_summary, created_at, updated_at"
        ).eq(
            "user_id", x_user_id
        ).order("created_at", desc=True).execute()

        return {
            "documents": response.data,
            "total": len(response.data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}")
async def get_document(
    document_id: str,
    x_user_id: str = Header(...)
):
    """Get a single document's details including status and summaries"""
    try:
        response = supabase.table("documents").select("*").eq(
            "id", document_id
        ).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found")

        doc = response.data[0]
        if doc['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        return doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}/status")
async def get_document_status(
    document_id: str,
    x_user_id: str = Header(...)
):
    """Get document processing status"""
    try:
        response = supabase.table("documents").select("id, status, filename").eq(
            "id", document_id
        ).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found")

        doc = response.data[0]
        return {
            "id": doc['id'],
            "filename": doc['filename'],
            "status": doc['status'],
            "ready": doc['status'] == "ready"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{document_id}/summary")
async def generate_document_summary(
    document_id: str,
    mode: Literal["short", "long"] = Query("short", description="Summary mode: short or long"),
    save: bool = Query(False, description="Save summary to database"),
    x_user_id: str = Header(...)
):
    """
    Generate a summary for a document.

    - **mode**: "short" for 1-2 paragraphs + 5 bullet points, "long" for detailed summary with sections
    - **save**: If true, saves the summary to the document record

    Returns:
    - summary: The generated summary text
    - mode: Which mode was used
    - sources: List of chunks used to generate the summary
    """
    try:
        # Check document exists and user has access
        doc = vector_store.get_document(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        if doc['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        if doc['status'] != "ready":
            raise HTTPException(
                status_code=400,
                detail=f"Document is not ready. Current status: {doc['status']}"
            )

        # Check if we already have this summary cached
        cached_summary = doc.get('short_summary') if mode == "short" else doc.get('long_summary')
        if cached_summary and not save:  # Return cached if exists and not forcing regeneration
            print(f"[summary] Returning cached {mode} summary for doc {document_id[:8]}")
            return {
                "mode": mode,
                "summary": cached_summary,
                "sources": [],  # Cached summary doesn't have sources
                "cached": True
            }

        # Get all chunks for the document
        chunks = await vector_store.get_document_chunks(document_id)

        if not chunks:
            raise HTTPException(status_code=400, detail="No content found for this document")

        # Build content from chunks (limit to avoid token overflow)
        max_content_length = 32000  # ~8k tokens
        content_parts = []
        total_length = 0

        for chunk in chunks:
            chunk_text = chunk['chunk_text']
            if total_length + len(chunk_text) > max_content_length:
                break
            content_parts.append(chunk_text)
            total_length += len(chunk_text)

        content = "\n\n".join(content_parts)

        # Generate summary using Ollama
        summary = await ollama_client.generate_summary(
            content=content,
            mode=mode,
            document_name=doc['filename']
        )

        # Prepare sources (chunks used for summarization)
        sources = [
            {
                "document_id": document_id,
                "chunk_id": str(chunk['id']),
                "chunk_index": chunk.get('chunk_index', chunk['chunk_number']),
                "page": chunk.get('page_number'),
                "line_start": chunk.get('line_start'),
                "line_end": chunk.get('line_end')
            }
            for chunk in chunks[:len(content_parts)]
        ]

        # Save summary if requested
        if save:
            try:
                if mode == "short":
                    vector_store.save_document_summary(document_id, short_summary=summary)
                else:
                    vector_store.save_document_summary(document_id, long_summary=summary)
            except Exception as e:
                print(f"[summary] Failed to save summary: {str(e)}")
                # Don't fail the request, just log

        return {
            "mode": mode,
            "summary": summary,
            "sources": sources,
            "cached": False
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[summary] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: str,
    x_user_id: str = Header(...)
):
    """Get all chunks for a document (for viewing sources)"""
    try:
        # Check document exists and user has access
        doc = vector_store.get_document(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        if doc['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        chunks = await vector_store.get_document_chunks(document_id)

        return {
            "document_id": document_id,
            "filename": doc['filename'],
            "chunks": chunks,
            "total": len(chunks)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}/chunks/{chunk_id}")
async def get_single_chunk(
    document_id: str,
    chunk_id: str,
    x_user_id: str = Header(...)
):
    """Get a single chunk by ID (for source preview)"""
    try:
        # Check document exists and user has access
        doc = vector_store.get_document(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        if doc['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        response = supabase.table("document_chunks").select(
            "id, chunk_text, chunk_number, chunk_index, page_number, line_start, line_end"
        ).eq("id", chunk_id).eq("document_id", document_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Chunk not found")

        chunk = response.data[0]
        return {
            "document_id": document_id,
            "filename": doc['filename'],
            "chunk": chunk
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    x_user_id: str = Header(...)
):
    """Delete a document and its chunks"""
    try:
        doc = supabase.table("documents").select("user_id").eq(
            "id", document_id
        ).execute()

        if not doc.data or doc.data[0]['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        supabase.table("documents").delete().eq(
            "id", document_id
        ).execute()

        return {"status": "deleted", "id": document_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
