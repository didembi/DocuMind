import httpx
from app.config import settings

class OllamaClient:
    """Local LLM chat using Ollama"""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.smalltalk = {"selam", "merhaba", "hello", "hi", "naber", "nasılsın",
                          "teşekkürler", "sağol", "hey", "mrb", "slm"}

    async def generate_answer(
        self,
        question: str,
        context: str,
        system_prompt: str = None
    ) -> str:
        """Generate answer using Ollama"""
        try:
            q = question.strip().lower()

            # Selamlaşma istisnası
            if q in self.smalltalk:
                return "Merhaba! Belgeyle ilgili bir soru sorarsan yüklediğin içerikten yanıtlayabilirim."

            if system_prompt is None:
                system_prompt = """Sen DocuMind asistanısın.
Öncelik: Kullanıcının sorusu belgeyle ilgiliyse SADECE verilen Bağlam'a dayanarak cevap ver.
Bağlam yetersizse: "Bu soruya verilen belgeler üzerinden cevap veremiyorum." de.
Eğer soru selamlaşma veya genel sohbetse, kısa ve nazikçe cevap verebilirsin.
Cevabı sorunun dilinde yaz."""

            print(f"[ollama] CTX_LEN: {len(context or '')}, CTX_PREVIEW: {(context or '')[:200]}")

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
                            "num_predict": 2048  # Artırıldı
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
