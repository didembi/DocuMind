# DocuMind

**AI-powered document assistant** - NotebookLM benzeri bir tam yığın belge yönetimi ve soru-cevap platformu.

![Tech Stack](https://img.shields.io/badge/React-19+-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![Gemini](https://img.shields.io/badge/Gemini-1.5+-4285F4?style=flat-square&logo=google)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0+-06B6D4?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-7.0+-646CFF?style=flat-square&logo=vite)

---

## ✨ Özellikler

### ✅ Tamamlanan Özellikler

- **Not Defteri Yönetimi**
  - Yeni not defteri oluşturma (2-adımlı modal)
  - Not defterini düzenleme (başlık değiştirme)
  - Not defterini silme (onay dialog'u ile)
  - Renk aksanları (5 renk seçeneği)

- **Kaynak Yönetimi**
  - PDF/DOCX/TXT dosya yükleme (drag & drop)
  - Metin yapıştırma (live preview ile)
  - Dosya işleme (PDF parsing, chunking)
  - Embedding oluşturma (Gemini AI)
  - Vektör veritabanı (Supabase pgvector)
  - Kaynak silme ve listesi görüntüleme

- **AI-Powered Sohbet**
  - Gerçek zamanlı soru-cevap
  - Bağlamsal yanıtlar (RAG - Retrieval Augmented Generation)
  - Kaynak bazlı yanıtlar
  - Streaming responses
  - Message bubbles (user/assistant)

- **UI/UX**
  - Dark mode (navy-purple gradient)
  - Subtle glassmorphism efektleri
  - Purple-blue gradient aksanlar
  - Smooth animations (200-300ms)
  - Responsive design (mobile/tablet/desktop)
  - Toast notifications (sonner)
  - Keyboard shortcuts (Esc, Enter)
  - Empty states ve loading states

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- **Frontend:** Node.js 18+, npm/yarn
- **Backend:** Python 3.9+, Supabase hesabı, Gemini API key

### 1️⃣ Frontend Kurulumu (5 dakika)

```bash
# Proje klasöründe
cd C:\Users\ddmbi\Desktop\DocuMind

# Bağımlılıkları yükle
npm install

# Development server başlat
npm run dev
```

**Frontend:** http://localhost:5173 ✅

### 2️⃣ Backend Kurulumu (10 dakika)

#### Supabase Kurulumu
1. [supabase.com](https://supabase.com) → Hesap oluştur
2. "New Project" → Proje oluştur
3. SQL Editor → `documind-backend/supabase_schema.sql` içeriğini yapıştır → Run
4. Settings → API → URL ve Keys'leri kopyala

#### Gemini API Key
1. [Google AI Studio](https://makersuite.google.com/app/apikey) → API key oluştur
2. Key'i kopyala

#### Backend Setup
```powershell
# Execution policy ayarla
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Setup scriptini çalıştır
.\backend-setup.ps1
```

#### Environment Variables
```bash
cd documind-backend
notepad .env
```

Aşağıdaki değerleri düzenle:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

#### Backend Başlat
```powershell
cd documind-backend
.\venv\Scripts\Activate
python -m uvicorn app.main:app --reload
```

**Backend:** http://localhost:8000 ✅

### 3️⃣ Test Et

1. **Frontend:** http://localhost:5173
2. **Backend API Docs:** http://localhost:8000/docs
3. **Health Check:** http://localhost:8000/health

---

## 📁 Proje Yapısı

```
DocuMind/
├── src/                          # React Frontend
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/               # Layout components
│   │   ├── home/                 # Home page components
│   │   ├── notebook/             # Notebook page components
│   │   └── common/               # Shared components
│   ├── pages/                    # Page components
│   ├── hooks/                    # React hooks
│   ├── services/                 # API services
│   ├── types/                    # TypeScript types
│   ├── lib/                      # Utilities
│   └── data/                     # Seed data
├── documind-backend/             # FastAPI Backend
│   ├── app/
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Business logic
│   │   ├── models/               # Data models
│   │   └── middleware/           # Middleware
│   ├── tests/                    # Backend tests
│   ├── migrations/               # Database migrations
│   └── requirements.txt          # Python dependencies
├── docs/                         # Documentation
└── public/                       # Static assets
```

---

## 🎨 Tasarım Sistemi

### Renk Paleti

- **Background**: `#1a1d2e` (deep navy)
- **Primary gradient**: Purple-Blue (`from-purple-600 to-blue-600`)
- **Glass border**: `rgba(255, 255, 255, 0.1)`

### Glassmorphism

```css
.glass-subtle {
  background: rgba(35, 40, 54, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

---

## 📦 Teknoloji Stack'i

### Frontend
- **React 19** + **TypeScript 5.9**
- **Vite 7** - Build tool & dev server
- **TailwindCSS v3** - Utility-first CSS
- **shadcn/ui** - Component library
- **Radix UI** - Unstyled UI primitives
- **React Router v7** - Client-side routing
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL + pgvector database
- **Google Gemini 1.5** - AI language model
- **LangChain** - LLM framework
- **PyPDF2** - PDF processing
- **python-multipart** - File uploads

### DevOps & Tools
- **Vitest** - Unit testing
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Autoprefixer** - CSS vendor prefixes

---

## 🔧 API Endpoints

### Notebooks
- `GET /api/notebooks` - List all notebooks
- `POST /api/notebooks` - Create new notebook
- `GET /api/notebooks/{id}` - Get notebook details
- `PUT /api/notebooks/{id}` - Update notebook
- `DELETE /api/notebooks/{id}` - Delete notebook

### Documents
- `POST /api/notebooks/{id}/documents` - Upload document
- `GET /api/notebooks/{id}/documents` - List documents
- `DELETE /api/notebooks/{id}/documents/{doc_id}` - Delete document

### Chat
- `POST /api/notebooks/{id}/chat` - Send chat message
- `GET /api/notebooks/{id}/chat/history` - Get chat history

### Health
- `GET /health` - Health check endpoint

---

## 🧪 Test Durumu

### ✅ Tamamlanan Testler
- [x] Frontend unit tests (Vitest + React Testing Library)
- [x] Backend API endpoint tests
- [x] PDF processing tests
- [x] Supabase connection tests
- [x] Gemini AI integration tests

### Test Komutları
```bash
# Frontend tests
npm run test
npm run test:run
npm run test:coverage

# Backend tests
cd documind-backend
python -m pytest tests/
```

---

## 🚀 Production Deployment

### Frontend Build
```bash
npm run build
npm run preview
```

### Backend Deployment
```bash
# Environment variables ayarla
cp documind-backend/.env.example documind-backend/.env

# Production server başlat
cd documind-backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 🐛 Bilinen Sorunlar & TODO

### Minor Issues
- File upload progress indicator eklenebilir
- Chat message timestamps gösterilebilir
- Bulk document operations implement edilebilir

### Future Enhancements
- [ ] User authentication (Supabase Auth)
- [ ] Document versioning
- [ ] Advanced search filters
- [ ] Export chat history
- [ ] Multi-language support

---

## 📚 Ek Dokümantasyon

- [Backend Integration Guide](BACKEND-INTEGRATION.md) - Detaylı backend entegrasyon adımları
- [Quick Start Guide](QUICK-START.md) - 3 adımda kurulum
- [Test Guide](TEST_GUIDE.md) - Test stratejisi ve örnekler
- [API Documentation](http://localhost:8000/docs) - Interactive API docs (FastAPI)

---

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

**Built with ❤️ using React, TypeScript, FastAPI, Supabase, and Gemini AI**
