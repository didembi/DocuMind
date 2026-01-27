# DocuMind Backend Setup Instructions

Bu rehber, DocuMind backend'ini lokal olarak çalıştırmak için adım adım talimatlar içerir.

---

## 📋 Prerequisites

### 1. Python Environment
- Python 3.9 veya üzeri
- pip package manager

### 2. Supabase Account
- [supabase.com](https://supabase.com) → Create account
- Create new project
- PostgreSQL database will be created automatically

### 3. Ollama Installation
- Download Ollama: [ollama.ai](https://ollama.ai)
- Install and run Ollama
- Pull model: `ollama pull gemma3:4b`
- Start Ollama service: `ollama serve`

---

## 🚀 Backend Setup (Windows)

### Step 1: Run PowerShell Script

```powershell
# In DocuMind folder
cd C:\Users\ddmbi\Desktop\DocuMind

# Set execution policy (if needed)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Run setup script
.\backend-setup.ps1
```

**Note:** The script will:
- Create `documind-backend` folder
- Set up folder structure
- Create virtual environment
- Install dependencies (FastAPI, Supabase, Ollama, etc.)
- Create `.env` file

### Step 2: Set Up Supabase Database

1. **Go to Supabase Dashboard**
   - https://app.supabase.com

2. **Create Database Schema**
   - Go to SQL Editor
   - Copy contents of `supabase-schema.sql`
   - Click Run

3. **Get API Keys**
   - Settings → API → Keys
   - Copy Project URL
   - Copy `anon public` key
   - Copy `service_role` key (keep secure!)

### Step 3: Configure Ollama

1. **Install Ollama**
   - Download from [ollama.ai](https://ollama.ai)
   - Install and run

2. **Pull Model**
   ```bash
   ollama pull gemma3:4b
   ```

3. **Start Ollama Service**
   ```bash
   ollama serve
   ```

### Step 4: Edit Environment Variables

```bash
cd documind-backend
notepad .env
```

**Edit these values:**
```env
# Supabase (REPLACE WITH YOUR VALUES)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # service_role key

# Ollama (Local LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b

# Embedding (Local)
EMBEDDING_MODEL=all-MiniLM-L6-v2

# JWT (GENERATE OR CHANGE)
JWT_SECRET_KEY=your-super-secret-key-change-in-production
```

---

## 🧪 Testing After Setup

### Step 1: Restart Backend
```powershell
cd C:\Users\ddmbi\Desktop\DocuMind\documind-backend
python -m uvicorn app.main:app --reload
```

### Step 2: Run Connection Test
```powershell
python test_connection.py
```

**Expected output:**
```
🔍 Testing Backend Configuration...

1️⃣ Checking Environment Variables:
   ✅ SUPABASE_URL: https://tenefjccumgmwwtucbzr.s...
   ✅ SUPABASE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ✅ OLLAMA_BASE_URL: http://localhost:11434
   ✅ OLLAMA_MODEL: gemma3:4b

2️⃣ Testing Supabase Connection:
   Using service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ✅ Connected! Documents count: 0

3️⃣ Testing Ollama Connection:
   ✅ Ollama working! Model 'gemma3:4b' is available
   Available models: ['gemma3:4b', ...]

🎉 All tests passed! Backend is ready to use.
```

### Step 3: Test from Frontend
1. Open frontend: `http://localhost:5173`
2. Create a notebook
3. Upload a PDF
4. Ask a question - should get AI response

---

## 🔧 Troubleshooting

### Ollama Connection Issues

**Error:** `Could not connect to Ollama`

**Solutions:**
1. Is Ollama running? (`ollama serve`)
2. Is model downloaded? (`ollama pull gemma3:4b`)
3. Check OLLAMA_BASE_URL in `.env` (should be `http://localhost:11434`)
4. Check OLLAMA_MODEL in `.env` (should be `gemma3:4b`)

### Supabase Connection Issues

**Error:** `Could not connect to Supabase`

**Solutions:**
1. Check `.env` values
2. Is Supabase project URL correct?
3. Are API keys valid?
4. Check RLS (Row Level Security) policies

### Common Issues Table

| Issue | Status | Solution |
|-------|--------|----------|
| Ollama not running | ❌ Not running | `ollama serve` |
| Model not downloaded | ❌ Model missing | `ollama pull gemma3:4b` |
| Wrong model name | ❌ Wrong config | Check OLLAMA_MODEL in `.env` |
| Supabase keys invalid | ❌ Auth failed | Regenerate keys in Supabase |

---

## 📊 API Endpoints

Once running, visit: `http://localhost:8000/docs`

### Notebooks
- `GET /api/notebooks` - List notebooks
- `POST /api/notebooks` - Create notebook
- `GET /api/notebooks/{id}` - Get notebook
- `PUT /api/notebooks/{id}` - Update notebook
- `DELETE /api/notebooks/{id}` - Delete notebook

### Documents
- `POST /api/notebooks/{id}/documents` - Upload document
- `GET /api/notebooks/{id}/documents` - List documents
- `DELETE /api/notebooks/{id}/documents/{doc_id}` - Delete document

### Chat
- `POST /api/notebooks/{id}/chat` - Send message
- `GET /api/notebooks/{id}/chat/history` - Get history

### Health
- `GET /health` - Health check

---

**Success! 🎉** Your DocuMind backend is now ready to use!
