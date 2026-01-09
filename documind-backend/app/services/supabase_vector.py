from app.database import supabase
from typing import List, Dict
from uuid import uuid4

class SupabaseVector:
    def __init__(self, similarity_threshold: float = 0.7):
        self.threshold = similarity_threshold

    def store_chunk(
        self,
        document_id: str,
        chunk_text: str,
        chunk_number: int,
        page_number: int,
        embedding: List[float]
    ) -> str:
        """Store chunk with embedding in Supabase"""
        try:
            chunk_id = str(uuid4())
            response = supabase.table("document_chunks").insert({
                "id": chunk_id,
                "document_id": document_id,
                "chunk_text": chunk_text,
                "chunk_number": chunk_number,
                "page_number": page_number,
                "embedding": embedding
            }).execute()

            return chunk_id
        except Exception as e:
            raise Exception(f"Failed to store chunk: {str(e)}")

    async def vector_search(
        self,
        query_embedding: List[float],
        document_ids: List[str],
        limit: int = 5
    ) -> List[Dict]:
        """Search similar chunks using pgvector cosine similarity"""
        try:
            # Call the match_document_chunks function we created in SQL
            response = supabase.rpc(
                'match_document_chunks',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': self.threshold,
                    'match_count': limit,
                    'filter_document_ids': document_ids
                }
            ).execute()

            return response.data
        except Exception as e:
            raise Exception(f"Vector search failed: {str(e)}")

vector_store = SupabaseVector()
