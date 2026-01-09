from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Backend
    BACKEND_URL: str = "http://localhost:8000"
    BACKEND_PORT: int = 8000
    DEBUG: bool = False

    # Database
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Embedding (Sentence-Transformers - Local)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"  # 384 dimensions, fast & good

    # Ollama (Local LLM)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma3:4b"  # Your installed model

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    FRONTEND_PROD_URL: Optional[str] = None

    class Config:
        env_file = ".env"

settings = Settings()
