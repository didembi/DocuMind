import httpx
from typing import Literal, Optional
from app.config import settings


class OllamaClient:
    """Local LLM chat using Ollama (RAG-friendly)"""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL

        self.smalltalk = {
            "selam", "merhaba", "hello", "hi", "naber", "nasılsın",
            "teşekkürler", "sağol", "hey", "mrb", "slm"
        }

        # Context limitleri (düşürüldü - hız için)
        self.max_ctx_chars_chat = 4000
        self.max_ctx_chars_summary_short = 6000
        self.max_ctx_chars_summary_long = 10000

        # Timeoutlar (artırıldı)
        self.timeout_chat = httpx.Timeout(connect=10.0, read=600.0, write=600.0, pool=10.0)
        self.timeout_summary = httpx.Timeout(connect=10.0, read=600.0, write=600.0, pool=10.0)

    def _truncate(self, text: str, limit: int) -> str:
        if not text:
            return ""
        text = text.strip()
        return text if len(text) <= limit else text[:limit] + "\n\n[...kısaltıldı...]"

    def _parse_ollama_response(self, data: dict) -> str:
        # Ollama /api/generate -> {"response": "..."}
        if isinstance(data, dict) and "response" in data and isinstance(data["response"], str):
            return data["response"].strip()

        # Bazı wrapper’lar / farklı formatlar
        if isinstance(data, dict) and "message" in data:
            msg = data["message"]
            if isinstance(msg, dict) and isinstance(msg.get("content"), str):
                return msg["content"].strip()

        return ""

    async def generate_answer(
        self,
        question: str,
        context: str,
        system_prompt: Optional[str] = None,
        sources_hint: Optional[str] = None,  # istersen “Kaynaklar: Page 5...” gibi eklersin
    ) -> str:
        """
        Chat/Q&A: Belge sorularında sadece context'e dayanır.
        Selamlaşma vb. küçük konuşmayı sadece context YOKSA serbest bırakır.
        """

        q = (question or "").strip()
        q_lower = q.lower()
        ctx = (context or "").strip()

        # ✅ Selamlaşma istisnası: SADECE context boşken devreye girsin
        if (not ctx) and (q_lower in self.smalltalk):
            return "Merhaba!  Belgeyle ilgili bir soru sorarsan yüklediğin içerikten yanıtlayabilirim."

        # Context çok uzunsa kırp
        ctx = self._truncate(ctx, self.max_ctx_chars_chat)

        if system_prompt is None:
            system_prompt = """
Sen DocuMind asistanısın.
Kural 1: Kullanıcının sorusu belgeyle ilgiliyse SADECE verilen Bağlam'a dayanarak cevap ver.
Kural 2: Bağlam yetersizse şu cümleyi kullan: "Bu soruya verilen belgeler üzerinden cevap veremiyorum."
Kural 3: Cevabı kısa, net ve görev-odaklı yaz. Cevap dili sorunun diliyle aynı olsun.
Kural 4: Cevabın sonunda MUTLAKA hangi kaynağı kullandığını belirt. Format: "📄 Kaynak: [Belge adı], [Konum]"
"""

        # Kaynakları prompt içine eklemek istersen
        if sources_hint:
            sources_block = f"\nKullanılabilir Kaynaklar:\n{sources_hint}\n"
        else:
            sources_block = ""

        full_prompt = f"""{system_prompt.strip()}

Bağlam:
{ctx}

{sources_block}
Soru: {q}

Cevap (sonunda kaynak belirt):
"""


        # Debug
        print(f"[ollama] MODEL={self.model} CTX_LEN={len(ctx)} Q_LEN={len(q)}")

        try:
            async with httpx.AsyncClient(timeout=self.timeout_chat) as client:
                resp = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.3,
                            "top_p": 0.9,
                            "num_predict": 512,  # Düşürüldü - hız için
                        },
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                text = self._parse_ollama_response(data)

                if not text:
                    raise RuntimeError(f"Unexpected Ollama response payload: {data}")

                return text

        except httpx.ConnectError:
            raise Exception("Ollama servisi çalışmıyor. Terminalde `ollama serve` açık mı?")
        except httpx.TimeoutException:
            raise Exception("Ollama timeout. Model yavaş olabilir veya context çok uzundur.")
        except Exception as e:
            print(f"[ollama] Error: {repr(e)}")
            raise Exception(f"Answer generation failed: {str(e)}")

    async def generate_summary(
        self,
        content: str,
        mode: Literal["short", "long"] = "short",
        document_name: str = "",
    ) -> str:
        """Document summary: short/long"""

        text = (content or "").strip()
        if not text:
            return "Özet oluşturmak için doküman içeriği bulunamadı."

        # Context limitleri mode'a göre
        if mode == "short":
            text = self._truncate(text, self.max_ctx_chars_summary_short)
            num_predict = 512  # Düşürüldü - hız için
            temperature = 0.2
            system_prompt = f"""
Sen DocuMind özetleyicisisin.
Doküman adı: {document_name}

Görev: KISA özet üret.
Format:
- 1 paragraf genel özet
- ardından en önemli 5 madde (• ile)
Kurallar:
- Sadece doküman içeriğine dayan
- Uydurma bilgi ekleme
- Türkçe yaz
"""
        else:
            text = self._truncate(text, self.max_ctx_chars_summary_long)
            num_predict = 1024  # Düşürüldü - hız için
            temperature = 0.2
            system_prompt = f"""
Sen DocuMind özetleyicisisin.
Doküman adı: {document_name}

Görev: DETAYLI özet üret.
Format:
1) Genel Bakış
2) Ana Konular (alt başlıklarla)
3) Önemli Noktalar (madde listesi)
4) Sonuç
Kurallar:
- Sadece doküman içeriğine dayan
- Uydurma bilgi ekleme
- Türkçe yaz
"""

        full_prompt = f"""{system_prompt.strip()}

Doküman İçeriği:
{text}

Özet:
"""

        print(f"[ollama] Summary mode={mode} CONTENT_LEN={len(text)} MODEL={self.model}")

        try:
            async with httpx.AsyncClient(timeout=self.timeout_summary) as client:
                resp = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "top_p": 0.9,
                            "num_predict": num_predict,
                        },
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                out = self._parse_ollama_response(data)

                if not out:
                    raise RuntimeError(f"Unexpected Ollama response payload: {data}")

                return out

        except httpx.ConnectError:
            raise Exception("Ollama servisi çalışmıyor. `ollama serve` açık mı?")
        except httpx.TimeoutException:
            raise Exception("Ollama timeout. Özet için içerik çok uzun olabilir.")
        except Exception as e:
            print(f"[ollama] Summary error: {repr(e)}")
            raise Exception(f"Summary generation failed: {str(e)}")

    async def check_health(self) -> bool:
        """Check if Ollama is running"""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                r = await client.get(f"{self.base_url}/api/tags")
                return r.status_code == 200
        except Exception:
            return False


ollama_client = OllamaClient()
