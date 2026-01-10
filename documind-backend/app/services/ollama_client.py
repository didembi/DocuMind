import httpx
from app.config import settings
from typing import Literal

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
Cevabı sorunun dilinde yaz.
Cevabında hangi bölümlerden yararlandığını belirt (sayfa numarası veya bölüm adı varsa)."""

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
                            "num_predict": 2048
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

    async def generate_summary(
        self,
        content: str,
        mode: Literal["short", "long"] = "short",
        document_name: str = ""
    ) -> str:
        """Generate document summary using Ollama"""
        try:
            if mode == "short":
                system_prompt = f"""Sen DocuMind özetleyicisisin.
Görevin: Verilen dokümanın KISA bir özetini çıkarmak.

Format:
1. Önce 1-2 paragraf genel özet yaz.
2. Ardından en önemli 5 maddeyi listele (• ile başlat).

Kurallar:
- Sadece doküman içeriğine dayan
- Özlü ve net ol
- Cevabı Türkçe yaz
- Doküman adı: {document_name}"""

            else:  # long
                system_prompt = f"""Sen DocuMind özetleyicisisin.
Görevin: Verilen dokümanın DETAYLI bir özetini çıkarmak.

Format:
1. Genel Bakış (2-3 paragraf)
2. Ana Konular (her biri için alt başlık ve açıklama)
3. Önemli Noktalar (madde listesi)
4. Sonuç ve Değerlendirme

Kurallar:
- Sadece doküman içeriğine dayan
- Her bölümü başlıkla ayır
- Detaylı ama gereksiz tekrar yapma
- Cevabı Türkçe yaz
- Doküman adı: {document_name}"""

            full_prompt = f"""{system_prompt}

Doküman İçeriği:
{content}

Özet:"""

            print(f"[ollama] Summary mode: {mode}, content length: {len(content)}")

            async with httpx.AsyncClient(timeout=180.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.5,  # Daha tutarlı özet için
                            "top_p": 0.9,
                            "num_predict": 4096  # Uzun özetler için
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                return result.get("response", "").strip()

        except httpx.ConnectError:
            raise Exception("Ollama servisi çalışmıyor. 'ollama serve' komutunu çalıştırın.")
        except httpx.TimeoutException:
            raise Exception("Ollama yanıt süresi doldu. Özet oluşturulamadı.")
        except Exception as e:
            print(f"[ollama] Summary error: {repr(e)}")
            raise Exception(f"Summary generation failed: {str(e)}")

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
