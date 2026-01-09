from sentence_transformers import SentenceTransformer
from app.config import settings
from typing import List

class EmbeddingClient:
    """Local embedding using Sentence-Transformers"""

    def __init__(self):
        self.model = None
        self.model_name = settings.EMBEDDING_MODEL

    def _load_model(self):
        """Lazy load the model (only when first needed)"""
        if self.model is None:
            print(f"[embedding] Loading model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            print(f"[embedding] Model loaded! Dimension: {self.model.get_sentence_embedding_dimension()}")
        return self.model

    def embed_text(self, text: str) -> List[float]:
        """Convert text to embedding vector"""
        try:
            if not text or not text.strip():
                return []

            model = self._load_model()
            embedding = model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            print(f"[embedding] Error: {repr(e)}")
            raise Exception(f"Embedding failed: {str(e)}")

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Convert multiple texts to embeddings (more efficient)"""
        try:
            if not texts:
                return []

            model = self._load_model()
            embeddings = model.encode(texts, convert_to_numpy=True)
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            print(f"[embedding] Batch error: {repr(e)}")
            raise Exception(f"Batch embedding failed: {str(e)}")

    def get_dimension(self) -> int:
        """Get embedding dimension size"""
        model = self._load_model()
        return model.get_sentence_embedding_dimension()

# Singleton instance
embedding_client = EmbeddingClient()
