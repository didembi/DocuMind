import google.generativeai as genai
from app.config import settings
from typing import List

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiClient:
    def __init__(self):
        self.embedding_model = settings.GEMINI_EMBEDDING_MODEL
        self.chat_model = settings.GEMINI_CHAT_MODEL

    def embed_text(self, text: str) -> List[float]:
        """Convert text to embedding vector (768 dimensions)"""
        try:
            if not text:
                return []

            result = genai.embed_content(
                model=self.embedding_model,
                content=text,
                task_type="semantic_similarity"
            )

            # Handle multiple possible response formats from the SDK
            # 1) dict with 'embedding'
            if isinstance(result, dict) and 'embedding' in result:
                return result['embedding']

            # 2) dict with 'data' -> list -> item with 'embedding'
            if isinstance(result, dict) and 'data' in result:
                data = result['data']
                if isinstance(data, list) and len(data) > 0:
                    first = data[0]
                    if isinstance(first, dict) and 'embedding' in first:
                        return first['embedding']

            # 3) object with attributes
            if hasattr(result, 'embedding'):
                return getattr(result, 'embedding')

            if hasattr(result, 'data'):
                data = getattr(result, 'data')
                try:
                    if isinstance(data, list) and len(data) > 0:
                        first = data[0]
                        if hasattr(first, 'embedding'):
                            return getattr(first, 'embedding')
                        if isinstance(first, dict) and 'embedding' in first:
                            return first['embedding']
                except Exception:
                    pass

            # If we reach here, the response format was unexpected
            raise Exception(f"Unexpected embed response format: {repr(result)}")
        except Exception as e:
            print(f"[gemini_client] Embedding error: {repr(e)}")
            raise Exception(f"Embedding failed: {str(e)}")

    async def generate_answer(
        self,
        question: str,
        context: str,
        system_prompt: str = "You are a helpful assistant. Answer based ONLY on the provided context. If the context doesn't contain relevant information, say 'I cannot answer this based on the provided documents.'"
    ) -> str:
        """Generate answer using Gemini"""
        try:
            model = genai.GenerativeModel(self.chat_model)

            full_prompt = f"""
{system_prompt}

Context:
{context}

Question: {question}

Answer (in the same language as the question):
"""

            response = model.generate_content(full_prompt)

            # response may be an object with `.text` or nested fields
            if hasattr(response, 'text'):
                return getattr(response, 'text')

            if isinstance(response, dict) and 'candidates' in response:
                # older/newer formats may use candidates or generations
                candidates = response.get('candidates') or response.get('generations')
                if isinstance(candidates, list) and len(candidates) > 0:
                    first = candidates[0]
                    if isinstance(first, dict) and 'content' in first:
                        return first['content']

            # fallback to string representation
            return str(response)
        except Exception as e:
            print(f"[gemini_client] Answer generation error: {repr(e)}")
            raise Exception(f"Answer generation failed: {str(e)}")

gemini_client = GeminiClient()
