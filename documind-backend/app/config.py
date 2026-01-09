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

    # Gemini
    GEMINI_API_KEY: str
    GEMINI_EMBEDDING_MODEL: str = "models/embedding-001"
    GEMINI_CHAT_MODEL: str = "gemini-pro"

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
