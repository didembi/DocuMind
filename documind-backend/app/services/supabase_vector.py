from app.database import supabase
from typing import List, Dict, Optional
import math
from uuid import uuid4

class SupabaseVector:
    def __init__(self, similarity_threshold: float = 0.3):  # Düşürüldü: 0.7 -> 0.3
        self.threshold = similarity_threshold

    def store_chunk(
        self,
        document_id: str,
        chunk_text: str,
        chunk_number: int,
        page_number: Optional[int],
        embedding: List[float],
        chunk_index: Optional[int] = None,
        line_start: Optional[int] = None,
        line_end: Optional[int] = None
    ) -> str:
        """Store chunk with embedding and location metadata in Supabase"""
        try:
            chunk_id = str(uuid4())
            response = supabase.table("document_chunks").insert({
                "id": chunk_id,
                "document_id": document_id,
                "chunk_text": chunk_text,
                "chunk_number": chunk_number,
                "chunk_index": chunk_index if chunk_index is not None else chunk_number,
                "page_number": page_number,
                "line_start": line_start,
                "line_end": line_end,
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
            # If RPC fails (for example due to overloaded function ambiguity),
            # fall back to a local similarity computation using stored embeddings.
            print(f"[vector] Search error: {str(e)}")
            err = str(e)
            try:
                print("[vector] Attempting local fallback search...")

                # Fetch chunks for the given documents
                resp = supabase.table("document_chunks").select(
                    "id, document_id, chunk_text, chunk_number, chunk_index, page_number, line_start, line_end, embedding"
                ).in_("document_id", document_ids).execute()

                rows = resp.data or []

                # Compute cosine similarity locally
                def cosine(a: List[float], b: List[float]) -> float:
                    try:
                        dot = 0.0
                        na = 0.0
                        nb = 0.0
                        for x, y in zip(a, b):
                            dot += x * y
                            na += x * x
                            nb += y * y
                        if na == 0 or nb == 0:
                            return 0.0
                        return dot / (math.sqrt(na) * math.sqrt(nb))
                    except Exception:
                        return 0.0

                scored = []
                for r in rows:
                    emb = r.get('embedding')
                    if not emb:
                        continue
                    sim = cosine(query_embedding, emb)
                    r['similarity'] = sim
                    scored.append(r)

                scored.sort(key=lambda x: x.get('similarity', 0), reverse=True)
                result = scored[:limit]

                print(f"[vector] Local fallback found {len(result)} chunks")
                return result
            except Exception as e2:
                print(f"[vector] Local fallback failed: {str(e2)}")
                raise Exception(f"Vector search failed: {err}")

    async def keyword_search(
        self,
        document_id: str,
        query: str,
        limit: int = 10
    ) -> List[Dict]:
        """Search chunks using keyword (ILIKE) matching"""
        try:
            print(f"[vector] Keyword search: '{query}' in doc {document_id[:8]}...")

            # RPC fonksiyonu kullan
            response = supabase.rpc('keyword_search_chunks', {
                'search_query': query,
                'filter_document_id': document_id,
                'result_limit': limit
            }).execute()

            print(f"[vector] Keyword search found {len(response.data)} chunks")
            return response.data
        except Exception as e:
            # RPC yoksa fallback: doğrudan sorgu
            print(f"[vector] RPC failed, using fallback: {str(e)}")
            try:
                response = supabase.table("document_chunks").select(
                    "id, document_id, chunk_text, chunk_number, chunk_index, page_number, line_start, line_end"
                ).eq("document_id", document_id).ilike(
                    "chunk_text", f"%{query}%"
                ).order("chunk_number").limit(limit).execute()

                return response.data
            except Exception as e2:
                print(f"[vector] Fallback also failed: {str(e2)}")
                raise Exception(f"Keyword search failed: {str(e2)}")

    async def get_document_chunks(
        self,
        document_id: str
    ) -> List[Dict]:
        """Get all chunks for a document (for summarization)"""
        try:
            print(f"[vector] Getting all chunks for doc {document_id[:8]}...")

            response = supabase.table("document_chunks").select(
                "id, chunk_text, chunk_number, chunk_index, page_number, line_start, line_end"
            ).eq("document_id", document_id).order("chunk_number").execute()

            print(f"[vector] Found {len(response.data)} chunks for summarization")
            return response.data
        except Exception as e:
            print(f"[vector] Get chunks error: {str(e)}")
            raise Exception(f"Failed to get document chunks: {str(e)}")

    def update_document_status(self, document_id: str, status: str) -> None:
        """Update document status (processing, ready, failed)"""
        try:
            supabase.table("documents").update({
                "status": status,
                "updated_at": "now()"
            }).eq("id", document_id).execute()
            print(f"[vector] Updated doc {document_id[:8]} status to {status}")
        except Exception as e:
            print(f"[vector] Status update error: {str(e)}")

    def save_document_summary(
        self,
        document_id: str,
        short_summary: Optional[str] = None,
        long_summary: Optional[str] = None
    ) -> None:
        """Save document summary to database"""
        try:
            update_data = {"updated_at": "now()"}
            if short_summary is not None:
                update_data["short_summary"] = short_summary
            if long_summary is not None:
                update_data["long_summary"] = long_summary

            supabase.table("documents").update(update_data).eq("id", document_id).execute()
            print(f"[vector] Saved summary for doc {document_id[:8]}")
        except Exception as e:
            print(f"[vector] Summary save error: {str(e)}")
            raise Exception(f"Failed to save summary: {str(e)}")

    def get_document(self, document_id: str) -> Optional[Dict]:
        """Get document metadata including summaries"""
        try:
            response = supabase.table("documents").select("*").eq("id", document_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"[vector] Get document error: {str(e)}")
            return None

vector_store = SupabaseVector()
