# DocuMind Backend Setup Instructions

## ✅ Completed Steps

1. ✅ Supabase URL corrected in `.env`
2. ✅ Service role key configured
3. ✅ Supabase connection verified

---

## 🚨 Required Actions

### 1. Create Database Tables in Supabase

Your Supabase connection is working, but you need to create all required tables:

1. Go to [Supabase Dashboard](https://app.supabase.com/project/tenefjccumgmwwtucbzr)
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify you see: `"Database schema created successfully!"`

**Expected tables created:**
- `users` - User management
- `documents` - Document metadata
- `document_chunks` - Text chunks with vector embeddings
- `queries` - User questions
- `answers` - AI responses

**Expected functions:**
- `match_document_chunks` - Vector similarity search
- `update_updated_at` - Auto-update timestamps

---

### 2. Fix Gemini API Quota Issue

**Current Error:**
```
429 You exceeded your current quota, please check your plan and billing details.
Quota: 0 requests remaining for embedding-001
```

**Solutions:**

**Option A: Wait for Reset (Free Tier)**
- Free tier quota resets daily
- Wait until tomorrow and try again
- Check current usage: [https://ai.dev/rate-limit](https://ai.dev/rate-limit)

**Option B: Upgrade to Paid Plan**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Navigate to **Billing** settings
3. Enable paid tier (pay-as-you-go)
4. Generate a new API key
5. Update `GEMINI_API_KEY` in `.env`

**Option C: Use Alternative Model (Temporary)**
- Edit `app/config.py` to use a different model
- Change `GEMINI_EMBEDDING_MODEL` to another available model

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
✅ SUPABASE_URL: https://tenefjccumgmwwtucbzr.s...
✅ SUPABASE_KEY: seyJ...
✅ GEMINI_API_KEY: AIza...
✅ Connected! Documents count: 0
✅ Gemini API working! Embedding size: 768
🎉 All tests passed! Backend is ready to use.
```

### Step 3: Test PDF Upload from Frontend
1. Open frontend: `http://localhost:5173`
2. Click "Yeni oluştur" (New notebook)
3. Upload a small PDF file
4. Watch backend console for processing logs

---

## 🔧 Troubleshooting

### If PDF Upload Still Fails

Check backend logs for specific errors:
```
INFO: 127.0.0.1:xxxxx - "POST /api/v1/documents/upload HTTP/1.1" 500
```

Common issues:
1. **Gemini quota exceeded** → Wait or upgrade
2. **Table not found** → Run SQL schema
3. **RLS policy error** → Service role key should bypass this
4. **Vector extension missing** → Run `CREATE EXTENSION IF NOT EXISTS vector;`

### Verify Database Tables Exist
```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected output:
- answers
- document_chunks
- documents
- queries
- users

---

## 📋 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Supabase Connection | ✅ Working | Using service role key |
| Database URL | ✅ Correct | `db.tenefjccumgmwwtucbzr.supabase.co` |
| Database Tables | ⚠️ Unknown | Need to run schema |
| Gemini API Key | ⚠️ Quota Exceeded | Wait or upgrade |
| Backend Server | 🟡 Ready | Needs restart after schema setup |
| Frontend | ✅ Ready | Listening on port 5173 |

---

## 🎯 Next Steps (In Order)

1. **Run SQL schema in Supabase** (5 minutes)
2. **Wait for Gemini quota reset** OR **upgrade plan** (varies)
3. **Restart backend server** (1 minute)
4. **Test PDF upload** (2 minutes)

---

## 📞 Support

If you encounter errors:
1. Check backend console logs
2. Check browser console (F12)
3. Verify `.env` file has correct values
4. Run `python test_connection.py` to diagnose

---

**Generated:** 2026-01-09
**Backend URL:** http://localhost:8000
**Frontend URL:** http://localhost:5173
**Supabase Project:** tenefjccumgmwwtucbzr
