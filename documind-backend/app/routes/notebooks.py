from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List, Literal
from uuid import uuid4
from app.database import supabase

router = APIRouter(prefix="/api/v1/notebooks", tags=["notebooks"])


# ============================================
# MODELS
# ============================================

class CreateNotebookRequest(BaseModel):
    title: str
    accent: Optional[str] = "purple"


class UpdateNotebookRequest(BaseModel):
    title: Optional[str] = None
    accent: Optional[str] = None


class MessageSource(BaseModel):
    document_id: str
    chunk_id: Optional[str] = None
    chunk_index: Optional[int] = None
    page: Optional[int] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None


class SaveMessageRequest(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    sources: Optional[List[MessageSource]] = None


# ============================================
# NOTEBOOK CRUD
# ============================================

@router.post("/")
async def create_notebook(
    request: CreateNotebookRequest,
    x_user_id: str = Header(..., description="User ID from frontend")
):
    """Create a new notebook"""
    notebook_id = str(uuid4())

    try:
        response = supabase.table("notebooks").insert({
            "id": notebook_id,
            "user_id": x_user_id,
            "title": request.title,
            "accent": request.accent or "purple"
        }).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create notebook")

        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_notebooks(x_user_id: str = Header(...)):
    """List all notebooks for a user with document counts"""
    try:
        # Get notebooks
        notebooks_response = supabase.table("notebooks").select(
            "id, title, accent, created_at, updated_at"
        ).eq(
            "user_id", x_user_id
        ).order("updated_at", desc=True).execute()

        notebooks = notebooks_response.data or []

        # Get document counts for each notebook
        for notebook in notebooks:
            docs_response = supabase.table("documents").select(
                "id", count="exact"
            ).eq("notebook_id", notebook["id"]).execute()
            notebook["document_count"] = docs_response.count or 0

        return {
            "notebooks": notebooks,
            "total": len(notebooks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{notebook_id}")
async def get_notebook(
    notebook_id: str,
    x_user_id: str = Header(...)
):
    """Get a notebook with its documents"""
    try:
        # Get notebook
        notebook_response = supabase.table("notebooks").select("*").eq(
            "id", notebook_id
        ).execute()

        if not notebook_response.data:
            raise HTTPException(status_code=404, detail="Notebook not found")

        notebook = notebook_response.data[0]

        if notebook['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Get documents for this notebook
        docs_response = supabase.table("documents").select(
            "id, filename, file_size, status, short_summary, created_at"
        ).eq("notebook_id", notebook_id).order("created_at", desc=False).execute()

        notebook["documents"] = docs_response.data or []

        return notebook
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{notebook_id}")
async def update_notebook(
    notebook_id: str,
    request: UpdateNotebookRequest,
    x_user_id: str = Header(...)
):
    """Update notebook title or accent"""
    try:
        # Check ownership
        notebook_response = supabase.table("notebooks").select("user_id").eq(
            "id", notebook_id
        ).execute()

        if not notebook_response.data:
            raise HTTPException(status_code=404, detail="Notebook not found")

        if notebook_response.data[0]['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Build update data
        update_data = {}
        if request.title is not None:
            update_data["title"] = request.title
        if request.accent is not None:
            update_data["accent"] = request.accent

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Update
        response = supabase.table("notebooks").update(update_data).eq(
            "id", notebook_id
        ).execute()

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{notebook_id}")
async def delete_notebook(
    notebook_id: str,
    x_user_id: str = Header(...)
):
    """Delete a notebook and all its documents and messages"""
    try:
        # Check ownership
        notebook_response = supabase.table("notebooks").select("user_id").eq(
            "id", notebook_id
        ).execute()

        if not notebook_response.data:
            raise HTTPException(status_code=404, detail="Notebook not found")

        if notebook_response.data[0]['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Delete notebook (CASCADE will delete documents and messages)
        supabase.table("notebooks").delete().eq("id", notebook_id).execute()

        return {"status": "deleted", "id": notebook_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# DOCUMENT - NOTEBOOK ASSOCIATION
# ============================================

@router.post("/{notebook_id}/documents/{document_id}")
async def add_document_to_notebook(
    notebook_id: str,
    document_id: str,
    x_user_id: str = Header(...)
):
    """Associate an existing document with a notebook"""
    try:
        # Check notebook ownership
        notebook_response = supabase.table("notebooks").select("user_id").eq(
            "id", notebook_id
        ).execute()

        if not notebook_response.data:
            raise HTTPException(status_code=404, detail="Notebook not found")

        if notebook_response.data[0]['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Check document ownership
        doc_response = supabase.table("documents").select("user_id").eq(
            "id", document_id
        ).execute()

        if not doc_response.data:
            raise HTTPException(status_code=404, detail="Document not found")

        if doc_response.data[0]['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Update document's notebook_id
        supabase.table("documents").update({
            "notebook_id": notebook_id
        }).eq("id", document_id).execute()

        return {"status": "linked", "notebook_id": notebook_id, "document_id": document_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{notebook_id}/documents/{document_id}")
async def remove_document_from_notebook(
    notebook_id: str,
    document_id: str,
    x_user_id: str = Header(...)
):
    """Remove a document from a notebook (doesn't delete the document)"""
    try:
        # Check notebook ownership
        notebook_response = supabase.table("notebooks").select("user_id").eq(
            "id", notebook_id
        ).execute()

        if not notebook_response.data:
            raise HTTPException(status_code=404, detail="Notebook not found")

        if notebook_response.data[0]['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Remove notebook_id from document
        supabase.table("documents").update({
            "notebook_id": None
        }).eq("id", document_id).eq("notebook_id", notebook_id).execute()

        return {"status": "unlinked", "document_id": document_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# CHAT MESSAGES
# ============================================

@router.get("/{notebook_id}/messages")
async def get_notebook_messages(
    notebook_id: str,
    limit: int = 100,
    x_user_id: str = Header(...)
):
    """Get chat messages for a notebook"""
    try:
        # Check notebook ownership
        notebook_response = supabase.table("notebooks").select("user_id").eq(
            "id", notebook_id
        ).execute()

        if not notebook_response.data:
            raise HTTPException(status_code=404, detail="Notebook not found")

        if notebook_response.data[0]['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Get messages
        messages_response = supabase.table("chat_messages").select(
            "id, role, content, sources, created_at"
        ).eq(
            "notebook_id", notebook_id
        ).order("created_at", desc=False).limit(limit).execute()

        return {
            "messages": messages_response.data or [],
            "total": len(messages_response.data or [])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{notebook_id}/messages")
async def save_message(
    notebook_id: str,
    request: SaveMessageRequest,
    x_user_id: str = Header(...)
):
    """Save a chat message to a notebook"""
    try:
        # Check notebook ownership
        notebook_response = supabase.table("notebooks").select("user_id").eq(
            "id", notebook_id
        ).execute()

        if not notebook_response.data:
            raise HTTPException(status_code=404, detail="Notebook not found")

        if notebook_response.data[0]['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        message_id = str(uuid4())

        # Insert message
        message_data = {
            "id": message_id,
            "notebook_id": notebook_id,
            "role": request.role,
            "content": request.content
        }

        if request.sources:
            message_data["sources"] = [s.model_dump() for s in request.sources]

        response = supabase.table("chat_messages").insert(message_data).execute()

        # Update notebook's updated_at
        supabase.table("notebooks").update({
            "updated_at": "now()"
        }).eq("id", notebook_id).execute()

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{notebook_id}/messages")
async def clear_messages(
    notebook_id: str,
    x_user_id: str = Header(...)
):
    """Clear all messages in a notebook"""
    try:
        # Check notebook ownership
        notebook_response = supabase.table("notebooks").select("user_id").eq(
            "id", notebook_id
        ).execute()

        if not notebook_response.data:
            raise HTTPException(status_code=404, detail="Notebook not found")

        if notebook_response.data[0]['user_id'] != x_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        # Delete all messages
        supabase.table("chat_messages").delete().eq("notebook_id", notebook_id).execute()

        return {"status": "cleared", "notebook_id": notebook_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
