from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import documents, queries, notebooks

app = FastAPI(
    title="DocuMind API",
    description="AI-powered document Q&A system",
    version="1.0.0"
)

# CORS Configuration for Frontend
origins = [
    settings.FRONTEND_URL,  # Development: http://localhost:5173
]

if settings.FRONTEND_PROD_URL:
    origins.append(settings.FRONTEND_PROD_URL)  # Production: https://your-app.vercel.app

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers (including x-user-id)
)

# Include routers
app.include_router(documents.router)
app.include_router(queries.router)
app.include_router(notebooks.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to DocuMind API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "version": "1.0.0",
        "backend_url": settings.BACKEND_URL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.BACKEND_PORT)
