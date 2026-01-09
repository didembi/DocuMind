from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from uuid import uuid4
from app.services.pdf_processor import pdf_processor
from app.services.embedding_client import embedding_client
from app.services.supabase_vector import vector_store
from app.database import supabase

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    x_user_id: str = Header(..., description="User ID from frontend")
):
    """Upload and process a document (PDF/TXT)"""
    try:
        content = await file.read()

        # Basic file type validation
        is_pdf = content.startswith(b"%PDF")
        is_txt = file.filename.lower().endswith(".txt") or file.content_type == "text/plain"

        if not (is_pdf or is_txt):
            raise HTTPException(status_code=400, detail="Only PDF or TXT files are accepted")

        doc_id = str(uuid4())

        # Store document metadata
        supabase.table("documents").insert({
            "id": doc_id,
            "user_id": x_user_id,
            "filename": file.filename,
            "file_size": len(content),
            "file_path": f"documents/{doc_id}.pdf"
        }).execute()

        # Extract chunks
        if is_txt:
            try:
                text = content.decode("utf-8", errors="ignore")
            except Exception:
                text = ""
            chunks = [{
                "chunk_number": 0,
                "page_number": 0,
                "text": text,
                "source": file.filename
            }]
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
                    page_number=chunk['page_number'],
                    embedding=embedding
                )
            except Exception as e:
                print(f"[upload] Chunk embedding error: {str(e)}")
                import traceback
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=str(e))

        return {
            "id": doc_id,
            "filename": file.filename,
            "chunks_count": len(chunks),
            "status": "ready"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_documents(x_user_id: str = Header(...)):
    """List all documents for a user"""
    try:
        response = supabase.table("documents").select("*").eq(
            "user_id", x_user_id
        ).order("created_at", desc=True).execute()

        return {
            "documents": response.data,
            "total": len(response.data)
        }
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
