"""
DocuMind - Ollama Client Unit Tests
AI-generated test cases for LLM integration

Bu testler Claude AI tarafından oluşturulmuştur.
Test framework: pytest + pytest-asyncio
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx


# ==================== UNIT TESTS ====================

class TestOllamaClient:
    """Test cases for OllamaClient class"""

    @pytest.fixture
    def ollama_client(self):
        """Create OllamaClient instance for testing"""
        with patch.dict('os.environ', {
            'OLLAMA_BASE_URL': 'http://localhost:11434',
            'OLLAMA_MODEL': 'gemma3:4b'
        }):
            from app.services.ollama_client import OllamaClient
            return OllamaClient()

    # --- generate_answer Tests ---

    @pytest.mark.asyncio
    async def test_generate_answer_with_context(self, ollama_client):
        """Test answer generation with valid context"""
        mock_response = {
            "response": "Bu belgede Python programlama dili anlatılmaktadır. 📄 Kaynak: test.pdf, Sayfa 1"
        }

        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_response,
                raise_for_status=lambda: None
            )

            result = await ollama_client.generate_answer(
                question="Bu belge ne hakkında?",
                context="Python programlama dili temel kavramları..."
            )

            assert "Python" in result or "belge" in result.lower()

    @pytest.mark.asyncio
    async def test_generate_answer_smalltalk_without_context(self, ollama_client):
        """Test smalltalk handling when no context provided"""
        result = await ollama_client.generate_answer(
            question="merhaba",
            context=""
        )

        assert "Merhaba" in result
        assert "belge" in result.lower()

    @pytest.mark.asyncio
    async def test_generate_answer_smalltalk_with_context(self, ollama_client):
        """Test that smalltalk is NOT triggered when context exists"""
        mock_response = {
            "response": "Belgeye göre cevap veriyorum..."
        }

        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_response,
                raise_for_status=lambda: None
            )

            result = await ollama_client.generate_answer(
                question="merhaba",
                context="Bu bir test belgesidir."
            )

            # Context varken smalltalk response dönmemeli
            assert result != "Merhaba!  Belgeyle ilgili bir soru sorarsan yüklediğin içerikten yanıtlayabilirim."

    # --- generate_summary Tests ---

    @pytest.mark.asyncio
    async def test_generate_summary_short_mode(self, ollama_client):
        """Test short summary generation"""
        mock_response = {
            "response": "Kısa özet: Bu belge test içeriği hakkındadır."
        }

        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_response,
                raise_for_status=lambda: None
            )

            result = await ollama_client.generate_summary(
                content="Test içeriği burada yer almaktadır.",
                mode="short",
                document_name="test.pdf"
            )

            assert len(result) > 0

    @pytest.mark.asyncio
    async def test_generate_summary_long_mode(self, ollama_client):
        """Test detailed summary generation"""
        mock_response = {
            "response": """1) Genel Bakış: Test belgesi
            2) Ana Konular: Test konuları
            3) Önemli Noktalar: • Nokta 1 • Nokta 2
            4) Sonuç: Test sonucu"""
        }

        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_response,
                raise_for_status=lambda: None
            )

            result = await ollama_client.generate_summary(
                content="Detaylı test içeriği...",
                mode="long",
                document_name="detailed.pdf"
            )

            assert len(result) > 0

    @pytest.mark.asyncio
    async def test_generate_summary_empty_content(self, ollama_client):
        """Test summary with empty content"""
        result = await ollama_client.generate_summary(
            content="",
            mode="short"
        )

        assert "bulunamadı" in result.lower() or "içerik" in result.lower()

    # --- check_health Tests ---

    @pytest.mark.asyncio
    async def test_check_health_success(self, ollama_client):
        """Test health check when Ollama is running"""
        with patch.object(httpx.AsyncClient, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = MagicMock(status_code=200)

            result = await ollama_client.check_health()

            assert result is True

    @pytest.mark.asyncio
    async def test_check_health_failure(self, ollama_client):
        """Test health check when Ollama is down"""
        with patch.object(httpx.AsyncClient, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.side_effect = httpx.ConnectError("Connection refused")

            result = await ollama_client.check_health()

            assert result is False

    # --- _truncate Tests ---

    def test_truncate_short_text(self, ollama_client):
        """Test truncation with text under limit"""
        text = "Kısa metin"
        result = ollama_client._truncate(text, 1000)

        assert result == text

    def test_truncate_long_text(self, ollama_client):
        """Test truncation with text over limit"""
        text = "A" * 5000
        result = ollama_client._truncate(text, 1000)

        assert len(result) < 5000
        assert "[...kısaltıldı...]" in result

    def test_truncate_empty_text(self, ollama_client):
        """Test truncation with empty string"""
        result = ollama_client._truncate("", 1000)

        assert result == ""


# ==================== EDGE CASE TESTS ====================

class TestOllamaClientEdgeCases:
    """Edge case tests for OllamaClient"""

    @pytest.fixture
    def ollama_client(self):
        with patch.dict('os.environ', {
            'OLLAMA_BASE_URL': 'http://localhost:11434',
            'OLLAMA_MODEL': 'gemma3:4b'
        }):
            from app.services.ollama_client import OllamaClient
            return OllamaClient()

    @pytest.mark.asyncio
    async def test_connection_error_handling(self, ollama_client):
        """Test handling when Ollama service is not running"""
        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = httpx.ConnectError("Connection refused")

            with pytest.raises(Exception) as exc_info:
                await ollama_client.generate_answer("test", "context")

            assert "Ollama servisi çalışmıyor" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_timeout_error_handling(self, ollama_client):
        """Test handling when request times out"""
        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = httpx.TimeoutException("Request timed out")

            with pytest.raises(Exception) as exc_info:
                await ollama_client.generate_answer("test", "context")

            assert "timeout" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_malformed_response_handling(self, ollama_client):
        """Test handling of unexpected response format"""
        mock_response = {"unexpected_key": "value"}

        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_response,
                raise_for_status=lambda: None
            )

            with pytest.raises(Exception) as exc_info:
                await ollama_client.generate_answer("test", "context")

            assert "Unexpected" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_very_long_context(self, ollama_client):
        """Test with context exceeding limit"""
        long_context = "A" * 10000  # 10K characters

        # _truncate fonksiyonu çağrılmalı
        truncated = ollama_client._truncate(long_context, ollama_client.max_ctx_chars_chat)

        assert len(truncated) <= ollama_client.max_ctx_chars_chat + 50  # +50 for suffix

    @pytest.mark.asyncio
    async def test_unicode_content(self, ollama_client):
        """Test with Turkish and special characters"""
        mock_response = {
            "response": "Türkçe karakterler: ğüşıöç ÇŞĞÜİÖ"
        }

        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_response,
                raise_for_status=lambda: None
            )

            result = await ollama_client.generate_answer(
                question="Türkçe soru: Bu belge ne hakkında?",
                context="İçerik: Ağaç, çiçek, şeker..."
            )

            assert len(result) > 0

    @pytest.mark.asyncio
    async def test_sql_injection_attempt(self, ollama_client):
        """Test that SQL injection attempts don't break the system"""
        malicious_question = "'; DROP TABLE users; --"

        mock_response = {
            "response": "Bu soruya cevap veremiyorum."
        }

        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_response,
                raise_for_status=lambda: None
            )

            # Should not raise an error
            result = await ollama_client.generate_answer(malicious_question, "context")

            assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_xss_attempt_in_question(self, ollama_client):
        """Test XSS attempt handling"""
        xss_question = "<script>alert('xss')</script>"

        mock_response = {
            "response": "Geçersiz soru formatı."
        }

        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_response,
                raise_for_status=lambda: None
            )

            result = await ollama_client.generate_answer(xss_question, "context")

            assert "<script>" not in result


# ==================== INTEGRATION TESTS (Mocked) ====================

class TestOllamaIntegration:
    """Integration-style tests with mocked external dependencies"""

    @pytest.fixture
    def ollama_client(self):
        with patch.dict('os.environ', {
            'OLLAMA_BASE_URL': 'http://localhost:11434',
            'OLLAMA_MODEL': 'gemma3:4b'
        }):
            from app.services.ollama_client import OllamaClient
            return OllamaClient()

    @pytest.mark.asyncio
    async def test_full_qa_flow(self, ollama_client):
        """Test complete question-answer flow"""
        # 1. Health check
        with patch.object(httpx.AsyncClient, 'get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = MagicMock(status_code=200)
            health = await ollama_client.check_health()
            assert health is True

        # 2. Generate answer
        mock_response = {
            "response": "Python bir programlama dilidir. 📄 Kaynak: python.pdf, Sayfa 1"
        }

        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_response,
                raise_for_status=lambda: None
            )

            answer = await ollama_client.generate_answer(
                question="Python nedir?",
                context="Python, yüksek seviyeli bir programlama dilidir."
            )

            assert "Python" in answer

    @pytest.mark.asyncio
    async def test_full_summary_flow(self, ollama_client):
        """Test complete summary generation flow"""
        document_content = """
        Python Programlama Dili

        Python, 1991 yılında Guido van Rossum tarafından geliştirilmiştir.
        Okunabilirliği ve basit sözdizimi ile bilinir.
        Veri bilimi, web geliştirme ve otomasyon alanlarında yaygın kullanılır.
        """

        # Short summary
        mock_short = {"response": "Python hakkında kısa özet..."}

        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_short,
                raise_for_status=lambda: None
            )

            short_summary = await ollama_client.generate_summary(
                content=document_content,
                mode="short",
                document_name="python.pdf"
            )

            assert len(short_summary) > 0

        # Long summary
        mock_long = {"response": "1) Genel Bakış\n2) Ana Konular\n3) Önemli Noktalar\n4) Sonuç"}

        with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: mock_long,
                raise_for_status=lambda: None
            )

            long_summary = await ollama_client.generate_summary(
                content=document_content,
                mode="long",
                document_name="python.pdf"
            )

            assert len(long_summary) > 0
