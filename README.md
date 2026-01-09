# DocuMind Frontend

**AI-powered document assistant** - NotebookLM benzeri bir belge yönetimi ve soru-cevap platformu.

![Tech Stack](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0+-06B6D4?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat-square&logo=vite)

---

## ✨ Özellikler

### MVP Özellikleri (Tamamlandı ✅)

- **Not Defteri Yönetimi**
  - Yeni not defteri oluşturma (2-adımlı modal)
  - Not defterini düzenleme (başlık değiştirme)
  - Not defterini silme (onay dialog'u ile)
  - Renk aksanları (5 renk seçeneği)

- **Kaynak Yönetimi**
  - PDF/DOCX/TXT dosya yükleme (drag & drop)
  - Metin yapıştırma (live preview ile)
  - Kaynak silme
  - Kaynak listesi görüntüleme

- **Sohbet Arayüzü**
  - Soru-cevap chat interface
  - Message bubbles (user/assistant)
  - Otomatik scroll
  - Demo AI responses

- **UI/UX**
  - Dark mode (navy-purple gradient)
  - Subtle glassmorphism efektleri
  - Purple-blue gradient aksanlar
  - Smooth animations (200-300ms)
  - Responsive design (mobile/tablet/desktop)
  - Toast notifications (sonner)
  - Keyboard shortcuts (Esc, Enter)
  - Empty states
  - Loading states

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Development server başlat
npm run dev

# Browser'da aç
open http://localhost:5173
```

### Production Build

```bash
# Build al
npm run build

# Preview
npm run preview
```

---

## 📁 Proje Yapısı

```
src/
├── components/
│   ├── ui/                 # shadcn/ui component'leri
│   ├── layout/             # Layout component'leri
│   ├── home/               # Home page component'leri
│   ├── notebook/           # Notebook page component'leri
│   └── common/             # Ortak component'ler
├── pages/
│   ├── Home.tsx            # Ana sayfa
│   └── Notebook.tsx        # Notebook detay
├── hooks/
│   ├── useNotebooks.ts
│   └── NotebooksContext.tsx
├── types/
│   └── index.ts
├── data/
│   └── seed.ts
└── lib/
    └── utils.ts
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

## 🧩 Component Kullanımı

### CreateNotebookDialog (2-step modal)

```tsx
<CreateNotebookDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  onCreate={(title, accent, sources) => {
    const id = createNotebook(title, accent, sources);
    navigate(`/notebook/${id}`);
  }}
/>
```

### Toast Notifications

```tsx
import { toast } from 'sonner';

toast.success('Not defteri oluşturuldu');
toast.error('Bir hata oluştu');
```

---

## 🔧 State Management

Context API kullanılıyor (mock data).

```tsx
const {
  notebooks,
  createNotebook,
  deleteNotebook,
  updateNotebookTitle,
  addSource,
  removeSource,
  getNotebook,
} = useNotebooksContext();
```

---

## 🗺️ Rotalar

```
/                   → Home (notebook listesi)
/notebook/:id       → Notebook detay (chat + sources)
```

---

## 📦 Teknoloji Stack'i

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS v3** - Styling
- **shadcn/ui** - Components
- **lucide-react** - Icons
- **Sonner** - Toast notifications
- **React Router v6** - Routing

---

## 🎯 Sonraki Adımlar (Backend Entegrasyonu)

### Phase 1: Backend Setup
- [ ] FastAPI backend oluştur
- [ ] Supabase PostgreSQL + pgvector setup
- [ ] Gemini API entegrasyonu
- [ ] LangChain PDF processing

### Phase 2: API Integration
- [ ] `useNotebooks` hook'unu API çağrılarıyla değiştir
- [ ] File upload endpoint'ini entegre et
- [ ] Chat streaming API'yi bağla

### Phase 3: Authentication
- [ ] Supabase Auth ekle
- [ ] Protected routes

---

## 🧪 Test Checklist

- [x] Home page 2 seed notebook gösteriyor
- [x] "Yeni oluştur" → 2-step modal → notebook oluştur
- [x] Notebook card'a tıkla → chat sayfası aç
- [x] Kebab menu → "Başlığı düzenle" / "Sil"
- [x] Toast notifications çalışıyor
- [x] Responsive design
- [x] Glassmorphism efektleri
- [x] Keyboard shortcuts

---

## 🐛 Bilinen Sorunlar

- Demo AI responses (backend entegre edilince düzelecek)
- Dosya yükleme fake (gerçek upload backend'de)

---

**Built with ❤️ using React, TypeScript, and TailwindCSS**
