# DocuMind Backend Integration Guide

Bu rehber, DocuMind frontend'ini backend ile entegre etmek için adım adım talimatlar içerir.

---

## 📋 Gereksinimler

### 1. Supabase Hesabı
- Supabase hesabı: https://supabase.com
- Yeni proje oluştur
- PostgreSQL database otomatik oluşturulacak

### 2. Gemini API Key
- Google AI Studio: https://makersuite.google.com/app/apikey
- API key oluştur (ücretsiz tier mevcut)

### 3. Python
- Python 3.9 veya üzeri
- pip package manager

---

## 🚀 Backend Setup (Windows)

### Adım 1: PowerShell Scriptini Çalıştır

```powershell
# DocuMind klasöründe
cd C:\Users\ddmbi\Desktop\DocuMind

# Execution policy ayarla (gerekirse)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Setup scriptini çalıştır
.\backend-setup.ps1
```

**Not:** Script şunları yapacak:
- `documind-backend` klasörü oluştur
- Folder structure kur
- Virtual environment oluştur
- Dependencies kur (FastAPI, Supabase, Gemini, vb.)
- `.env` dosyası oluştur

### Adım 2: Supabase Database Kur

1. **Supabase Dashboard'a git**
   - https://app.supabase.com

2. **SQL Editor'ı aç**
   - Sol menüden "SQL Editor" seç

3. **Schema'yı çalıştır**
   - `supabase-schema.sql` dosyasını aç
   - Tüm içeriği SQL Editor'a yapıştır
   - "Run" butonuna tıkla

4. **Doğrula**
   - "Table Editor" sekmesine git
   - `documents`, `document_chunks`, `queries` tablolarını gör

### Adım 3: API Keys'leri Ayarla

1. **Supabase Keys**
   - Supabase Dashboard → Settings → API
   - `Project URL` kopyala
   - `anon public` key kopyala
   - `service_role` key kopyala (güvenli!)

2. **Gemini API Key**
   - https://makersuite.google.com/app/apikey
   - API key oluştur ve kopyala

3. **.env Dosyasını Düzenle**

```bash
cd documind-backend
notepad .env
```

**.env içeriği:**
```env
# Backend
BACKEND_URL=http://localhost:8000
BACKEND_PORT=8000
DEBUG=True

# Supabase (KENDİ DEĞERLERİNİZLE DEĞİŞTİRİN)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # service_role key

# Gemini API (KENDİ KEYİNİZLE DEĞİŞTİRİN)
GEMINI_API_KEY=AIzaSy...

# JWT (ÜRETİN VEYA DEĞİŞTİRİN)
JWT_SECRET_KEY=super-secret-key-change-this-in-production-12345

# Frontend CORS
FRONTEND_URL=http://localhost:5173
```

**Önemli:** Köşeli parantezlerdeki değerleri kendi Supabase değerlerinizle değiştirin!

### Adım 4: Backend'i Başlat

```powershell
cd documind-backend

# Virtual environment'ı aktifleştir
.\venv\Scripts\Activate

# Backend'i çalıştır
python -m uvicorn app.main:app --reload
```

**Çıktı:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Adım 5: API'yi Test Et

1. **Health Check**
   ```
   http://localhost:8000/health
   ```
   Response: `{"status": "ok", "version": "1.0.0"}`

2. **API Documentation**
   ```
   http://localhost:8000/docs
   ```
   Swagger UI açılacak, tüm endpoint'leri görebilirsiniz.

---

## 🔗 Frontend-Backend Bağlantısı

### API Client Oluştur

Frontend'te API istekleri için bir client oluşturun:

```bash
cd C:\Users\ddmbi\Desktop\DocuMind

# API service oluştur
mkdir src/services
```

**`src/services/api.ts`**
```typescript
const API_URL = 'http://localhost:8000/api/v1';
const USER_ID = 'demo_user'; // MVP için sabit user ID

export const api = {
  // Document endpoints
  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'x-user-id': USER_ID,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  async listDocuments() {
    const response = await fetch(`${API_URL}/documents/`, {
      headers: {
        'x-user-id': USER_ID,
      },
    });

    return response.json();
  },

  async deleteDocument(documentId: string) {
    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': USER_ID,
      },
    });

    return response.json();
  },

  // Query endpoint
  async queryDocuments(question: string, documentIds: string[]) {
    const response = await fetch(`${API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': USER_ID,
      },
      body: JSON.stringify({
        question,
        document_ids: documentIds,
        search_limit: 5,
      }),
    });

    if (!response.ok) {
      throw new Error('Query failed');
    }

    return response.json();
  },
};
```

### Frontend Component'lerini Güncelle

**1. CreateNotebookDialog - Dosya Upload**

```tsx
// src/components/home/CreateNotebookDialog.tsx

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = Array.from(e.target.files || []);

  for (const file of selectedFiles) {
    try {
      // Backend'e upload et
      const response = await api.uploadDocument(file);

      // Sonucu kaydet
      setFiles((prev) => [...prev, {
        name: file.name,
        file,
        documentId: response.id,  // Backend'den dönen ID
      }]);

      toast.success(`${file.name} yüklendi`);
    } catch (error) {
      toast.error(`${file.name} yüklenemedi`);
    }
  }
};
```

**2. Composer - AI Query**

```tsx
// src/components/notebook/Composer.tsx

const handleSendMessage = async (content: string) => {
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content,
    createdAt: new Date(),
  };

  setMessages((prev) => [...prev, userMessage]);

  try {
    // Backend'e query gönder
    const documentIds = notebook.sources.map((s) => s.documentId);
    const response = await api.queryDocuments(content, documentIds);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.answer,
      sources: response.sources,  // Kaynak bilgisi
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
  } catch (error) {
    toast.error('Bir hata oluştu');
  }
};
```

---

## 🧪 Test Senaryosu

### 1. Backend Test

```bash
# Terminal 1: Backend çalıştır
cd documind-backend
.\venv\Scripts\Activate
python -m uvicorn app.main:app --reload
```

### 2. Frontend Test

```bash
# Terminal 2: Frontend çalıştır
cd C:\Users\ddmbi\Desktop\DocuMind
npm run dev
```

### 3. Entegrasyon Test

1. **Browser'da aç**: http://localhost:5173
2. **Not defteri oluştur**
3. **PDF yükle** → Backend'e gidecek, işlenecek
4. **Soru sor** → Backend AI'dan cevap alacak
5. **Network sekmesinde** API isteklerini kontrol et

---

## 🔍 API Endpoint Referansı

### Documents

**POST /api/v1/documents/upload**
- Header: `x-user-id: demo_user`
- Body: FormData with file
- Response: `{ id, filename, chunks_count, status }`

**GET /api/v1/documents/**
- Header: `x-user-id: demo_user`
- Response: `{ documents: [], total }`

**DELETE /api/v1/documents/{id}**
- Header: `x-user-id: demo_user`
- Response: `{ status: "deleted", id }`

### Queries

**POST /api/v1/query**
- Header: `x-user-id: demo_user`
- Body: `{ question, document_ids, search_limit }`
- Response: `{ query_id, question, answer, sources }`

**GET /api/v1/queries**
- Header: `x-user-id: demo_user`
- Response: `{ queries: [], total }`

---

## 🛠️ Troubleshooting

### CORS Hatası

**Hata:** `Access to fetch blocked by CORS policy`

**Çözüm:**
1. Backend `.env` dosyasında `FRONTEND_URL=http://localhost:5173` olduğundan emin olun
2. Backend'i restart edin
3. Frontend'i restart edin

### Connection Refused

**Hata:** `Failed to fetch` veya `Connection refused`

**Çözüm:**
1. Backend çalışıyor mu? → `http://localhost:8000/health`
2. Port 8000 kullanılıyor mu? → Başka bir port deneyin
3. Firewall engelliyor mu?

### Supabase Connection Error

**Hata:** `Could not connect to Supabase`

**Çözüm:**
1. `.env` değerlerini kontrol edin
2. Supabase project URL doğru mu?
3. API keys geçerli mi?
4. RLS (Row Level Security) politikaları doğru mu?

### Gemini API Error

**Hata:** `Embedding failed` veya `Answer generation failed`

**Çözüm:**
1. Gemini API key geçerli mi?
2. Quota doldu mu? (ücretsiz tier limitli)
3. API key aktif mi?

---

## 📦 Deployment

### Backend (Railway.app)

1. Railway hesabı oluştur
2. Yeni proje oluştur
3. GitHub'dan deploy et
4. Environment variables ekle (.env değerleri)
5. Port: 8000

### Frontend (Vercel)

1. Vercel hesabı oluştur
2. GitHub'dan deploy et
3. Build command: `npm run build`
4. Environment variable: `VITE_API_URL=https://your-backend.railway.app`

---

## ✅ Integration Checklist

- [ ] Backend çalışıyor (`http://localhost:8000/health`)
- [ ] Supabase database kuruldu
- [ ] pgvector extension aktif
- [ ] Tablolar oluşturuldu (documents, document_chunks, queries)
- [ ] `.env` dosyası düzenlendi (Supabase, Gemini keys)
- [ ] API client oluşturuldu (`src/services/api.ts`)
- [ ] File upload backend'e bağlandı
- [ ] Chat query backend'e bağlandı
- [ ] CORS ayarları çalışıyor
- [ ] Toast notifications gösteriliyor
- [ ] Frontend ve backend aynı anda çalışıyor

---

**Başarılar! 🎉** Backend entegrasyonu tamamlandığında DocuMind tam fonksiyonel olacak!
