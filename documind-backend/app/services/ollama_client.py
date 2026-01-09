import httpx
from app.config import settings

class OllamaClient:
    """Local LLM chat using Ollama"""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL

    async def generate_answer(
        self,
        question: str,
        context: str,
        system_prompt: str = None
    ) -> str:
        """Generate answer using Ollama"""
        try:
            if system_prompt is None:
                system_prompt = """Sen yardımcı bir asistansın. Soruları YALNIZCA verilen bağlam (context) bilgisine göre cevapla.
Eğer bağlamda ilgili bilgi yoksa, 'Bu soruya verilen belgeler üzerinden cevap veremiyorum.' de.
Cevabını soru hangi dildeyse o dilde ver."""

            full_prompt = f"""{system_prompt}

Bağlam:
{context}

Soru: {question}

Cevap:"""

            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "num_predict": 1024
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                return result.get("response", "").strip()

        except httpx.ConnectError:
            raise Exception("Ollama servisi çalışmıyor. 'ollama serve' komutunu çalıştırın.")
        except httpx.TimeoutException:
            raise Exception("Ollama yanıt süresi doldu. Model çok yavaş olabilir.")
        except Exception as e:
            print(f"[ollama] Error: {repr(e)}")
            raise Exception(f"Answer generation failed: {str(e)}")

    async def check_health(self) -> bool:
        """Check if Ollama is running"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False

# Singleton instance
ollama_client = OllamaClient()
