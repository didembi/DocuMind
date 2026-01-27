# DocuMind Backend Setup - Windows PowerShell Script
# Usage: .\backend-setup.ps1

Write-Host "🚀 DocuMind Backend Setup Starting..." -ForegroundColor Green

# Phase 1: Create backend folder structure
Write-Host "`n📁 Creating backend structure..." -ForegroundColor Cyan

$backendPath = ".\documind-backend"
New-Item -ItemType Directory -Force -Path $backendPath | Out-Null
Set-Location $backendPath

# Create folder structure
$folders = @(
    "app",
    "app\routes",
    "app\services",
    "app\models",
    "app\middleware",
    "tests"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

# Create __init__.py files
$initFiles = @(
    "app\__init__.py",
    "app\routes\__init__.py",
    "app\services\__init__.py",
    "app\models\__init__.py",
    "app\middleware\__init__.py",
    "tests\__init__.py"
)

foreach ($file in $initFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

Write-Host "✅ Folder structure created" -ForegroundColor Green

# Phase 2: Create requirements.txt
Write-Host "`n📦 Creating requirements.txt..." -ForegroundColor Cyan

$requirements = @"
# Core
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Database
supabase==2.3.5
psycopg2-binary==2.9.9

# PDF Processing
pypdf==3.17.1
langchain==0.1.0
langchain-community==0.0.10

# AI/LLM
google-generativeai==0.3.0

# Auth
PyJWT==2.8.1
python-jose==3.3.0
passlib[bcrypt]==1.7.4

# Utils
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
httpx==0.25.0

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
"@

Set-Content -Path "requirements.txt" -Value $requirements
Write-Host "✅ requirements.txt created" -ForegroundColor Green

# Phase 3: Create .env files
Write-Host "`n🔐 Creating .env files..." -ForegroundColor Cyan

$envExample = @"
# Backend
BACKEND_URL=http://localhost:8000
BACKEND_PORT=8000
DEBUG=True

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Ollama (Local LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b

# Embedding (Local)
EMBEDDING_MODEL=all-MiniLM-L6-v2

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173
FRONTEND_PROD_URL=https://your-frontend.vercel.app
"@

Set-Content -Path ".env.example" -Value $envExample
Copy-Item ".env.example" -Destination ".env"

Write-Host "✅ .env files created (edit .env with real values)" -ForegroundColor Green

# Phase 4: Create .gitignore
Write-Host "`n🚫 Creating .gitignore..." -ForegroundColor Cyan

$gitignore = @"
venv/
.env
.env.local
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
.pytest_cache/
.coverage
htmlcov/
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
"@

Set-Content -Path ".gitignore" -Value $gitignore
Write-Host "✅ .gitignore created" -ForegroundColor Green

# Phase 5: Create virtual environment
Write-Host "`n🐍 Creating Python virtual environment..." -ForegroundColor Cyan

python -m venv venv

Write-Host "✅ Virtual environment created" -ForegroundColor Green

# Phase 6: Activate venv and install dependencies
Write-Host "`n🔧 Installing dependencies..." -ForegroundColor Cyan
Write-Host "⚠️  This may take a few minutes..." -ForegroundColor Yellow

.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt

Write-Host "✅ Dependencies installed" -ForegroundColor Green

Write-Host "`n✨ ✨ ✨ SETUP COMPLETE! ✨ ✨ ✨" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env with your real values (Supabase, Ollama)" -ForegroundColor White
Write-Host "2. Run SQL schema in Supabase (see supabase-schema.sql)" -ForegroundColor White
Write-Host "3. Start backend: python -m uvicorn app.main:app --reload" -ForegroundColor White
Write-Host "4. Check health: http://localhost:8000/health" -ForegroundColor White
Write-Host "5. View API docs: http://localhost:8000/docs" -ForegroundColor White

Set-Location ..
