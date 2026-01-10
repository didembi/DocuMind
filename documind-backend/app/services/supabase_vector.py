from app.database import supabase
from typing import List, Dict
from uuid import uuid4

class SupabaseVector:
    def __init__(self, similarity_threshold: float = 0.3):  # Düşürüldü: 0.7 -> 0.3
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
            print(f"[vector] Stored chunk {chunk_number} for doc {document_id[:8]}...")
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
            print(f"[vector] Searching in {len(document_ids)} documents...")
            print(f"[vector] Document IDs: {document_ids}")
            print(f"[vector] Embedding length: {len(query_embedding)}")
            print(f"[vector] Threshold: {self.threshold}")

            # Debug: Print raw params
            params = {
                'query_embedding': query_embedding,
                'match_threshold': self.threshold,
                'match_count': limit,
                'filter_document_ids': document_ids
            }
            print(f"[vector] RPC params: threshold={self.threshold}, count={limit}")
            print(f"[vector] filter_document_ids type: {type(document_ids)}, value: {document_ids}")

            response = supabase.rpc('match_document_chunks', params).execute()

            print(f"[vector] Response data: {response.data}")
            print(f"[vector] Found {len(response.data)} chunks")
            return response.data
        except Exception as e:
            print(f"[vector] Search error: {str(e)}")
            raise Exception(f"Vector search failed: {str(e)}")

vector_store = SupabaseVector()
