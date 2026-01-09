# DocuMind Quick Start Guide

**3 adımda DocuMind'ı çalıştırın!**

---

## ⚡ Hızlı Kurulum

### 1️⃣ Frontend Setup (5 dakika)

```bash
# DocuMind klasöründe
cd C:\Users\ddmbi\Desktop\DocuMind

# Bağımlılıkları kur (ilk kez)
npm install

# Development server başlat
npm run dev
```

**Açılacak:** http://localhost:5173

✅ Frontend çalışıyor! (mock data ile)

---

### 2️⃣ Backend Setup (10 dakika)

**A) Supabase Hazırlık**
1. https://supabase.com → Hesap aç
2. "New Project" oluştur
3. SQL Editor → `supabase-schema.sql` içeriğini yapıştır → Run
4. Settings → API → Keys'leri kopyala

**B) Gemini API Key**
1. https://makersuite.google.com/app/apikey
2. API key oluştur → Kopyala

**C) Backend Kur**
```powershell
# DocuMind klasöründe
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\backend-setup.ps1
```

**D) .env Düzenle**
```bash
cd documind-backend
notepad .env
```

Değiştir:
- `SUPABASE_URL` → Kendi project URL'in
- `SUPABASE_KEY` → Kendi anon key'in
- `SUPABASE_SERVICE_ROLE_KEY` → Kendi service role key'in
- `GEMINI_API_KEY` → Kendi Gemini API key'in

**E) Backend Başlat**
```powershell
cd documind-backend
.\venv\Scripts\Activate
python -m uvicorn app.main:app --reload
```

**Açılacak:** http://localhost:8000

✅ Backend çalışıyor!

---

### 3️⃣ Frontend-Backend Bağla (5 dakika)

**A) API Service Oluştur**
```bash
cd C:\Users\ddmbi\Desktop\DocuMind
mkdir src\services
notepad src\services\api.ts
```

**api.ts içeriği:** (BACKEND-INTEGRATION.md'de var)

**B) Component'leri Güncelle**
- CreateNotebookDialog → File upload backend'e
- Composer → Chat query backend'e

(Detaylar: BACKEND-INTEGRATION.md)

---

## ✅ Test Et

1. **Frontend:** http://localhost:5173
2. **Backend:** http://localhost:8000/docs
3. **Health Check:** http://localhost:8000/health

**İşlem akışı:**
1. Not defteri oluştur
2. PDF yükle (backend'e gidecek)
3. Soru sor (AI cevap verecek)

---

## 🆘 Sorun mu yaşıyorsun?

**Backend çalışmıyor?**
- `.env` dosyası düzgün mü?
- Supabase keys doğru mu?
- Port 8000 kullanılıyor mu?

**CORS hatası?**
- Backend `.env` → `FRONTEND_URL=http://localhost:5173`
- Her iki servisi de restart et

**Gemini API hatası?**
- API key geçerli mi?
- Quota dolmadı mı?

---

## 📚 Detaylı Dokümantasyon

- Frontend: `README.md`
- Backend Integration: `BACKEND-INTEGRATION.md`
- Database Schema: `supabase-schema.sql`

---

**Başarılar! 🚀**
