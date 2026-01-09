# 🔒 DocuMind Güvenlik Rehberi

## ⚠️ ÖNEMLİ: API Keys ve Hassas Bilgiler

**ASLA GitHub'a yüklemeyin:**
- `.env` dosyası (API keys, database credentials)
- Supabase service role keys
- Gemini API keys
- JWT secret keys
- Database passwords

---

## ✅ Güvenlik Kontrol Listesi

### 1. .gitignore Kontrolü

**Backend'de:**
```bash
cd documind-backend
cat .gitignore
```

**Şunları içermeli:**
```
.env
.env.local
venv/
__pycache__/
```

**Frontend'de:**
```bash
cd C:\Users\ddmbi\Desktop\DocuMind
cat .gitignore
```

**Şunları içermeli:**
```
.env
.env.local
.env.production.local
node_modules/
dist/
```

### 2. Git Status Kontrolü

```bash
# Backend'de
cd documind-backend
git status

# .env dosyası listede OLMADIĞINDAN emin olun
# Eğer varsa DURDURUN ve aşağıdaki adımları uygulayın
```

### 3. Yanlışlıkla Commit Edildi mi?

**Kontrol:**
```bash
git log --all --full-history -- .env
```

**Eğer output varsa (tehlike!):**
```bash
# .env'yi Git history'den tamamen sil
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch documind-backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (dikkatli!)
git push origin --force --all
```

**Daha iyi yöntem (BFG Repo-Cleaner):**
```bash
# BFG indir: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push origin --force --all
```

---

## 🔐 Doğru Kullanım

### .env.example vs .env

**.env.example (GitHub'a GİDER ✅)**
```env
# Backend
BACKEND_URL=http://localhost:8000
BACKEND_PORT=8000
DEBUG=True

# Supabase (PLACEHOLDER değerler)
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Gemini API (PLACEHOLDER)
GEMINI_API_KEY=your-gemini-api-key-here

# JWT
JWT_SECRET_KEY=change-this-in-production
```

**.env (GitHub'a GİTMEZ ❌)**
```env
# Gerçek değerler (GİZLİ!)
SUPABASE_URL=https://abcdef12345.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...
GEMINI_API_KEY=AIzaSyD8xN4ZmP3QrT2vK9Lw8eF6pJ1mR7nB5cA
JWT_SECRET_KEY=aKf8jD9mW2nP4qR7sT1vX6yZ3bC5eG8hJ0kL2nM4pQ7rS9tU1v
```

---

## 📋 GitHub'a Push Etmeden Önce

### Kontrol Listesi

```bash
# 1. .gitignore var mı?
ls -la .gitignore

# 2. .env ignore edilmiş mi?
git check-ignore .env
# Çıktı: .env (✅ İyi!)
# Çıktı yok: (❌ Tehlike!)

# 3. Staged files kontrol
git status
# ".env" OLMAMALI!

# 4. Son kontrol
git diff --cached
# .env içeriği GÖRÜNMEMELI!
```

### Güvenli Push

```bash
# Sadece .env.example commit et
git add .env.example
git commit -m "Add environment variables template"
git push origin main
```

---

## 🚨 Acil Durum: API Key Sızdı!

### Derhal Yapılacaklar

**1. Supabase Keys Sızdıysa:**
- Supabase Dashboard → Settings → API → "Reset service_role key"
- Yeni key'i `.env`'ye ekle
- Eski key'i kullanan tüm servisleri güncelle

**2. Gemini API Key Sızdıysa:**
- Google AI Studio → API Keys → Delete sızan key
- Yeni key oluştur
- `.env` güncelle

**3. JWT Secret Sızdıysa:**
- Yeni secret oluştur: `openssl rand -base64 64`
- `.env` güncelle
- Tüm kullanıcıların yeniden login olması gerekecek

**4. GitHub'dan Temizle:**
- BFG Repo-Cleaner kullan (yukarıda anlatıldı)
- VEYA: Repository'yi sil ve yeniden oluştur (en güvenli)

---

## 🛡️ Ek Güvenlik Önlemleri

### 1. Environment Variables (Production)

**Vercel (Frontend):**
- Dashboard → Settings → Environment Variables
- `.env` değerlerini buraya ekle
- `VITE_API_URL` gibi production değerler

**Railway (Backend):**
- Dashboard → Variables
- `.env` değerlerini buraya ekle
- Otomatik deployment her seferinde yeniler

### 2. .env Şifreleme (Opsiyonel)

```bash
# GPG ile şifrele
gpg -c .env  # .env.gpg oluşturur

# Decrypt
gpg -d .env.gpg > .env
```

**.gitignore'a ekle:**
```
.env
.env.gpg  # (opsiyonel, eğer GitHub'a yüklemek istemiyorsanız)
```

### 3. Git Hooks (Pre-commit)

`.git/hooks/pre-commit` dosyası oluştur:
```bash
#!/bin/bash

# .env dosyası staged mı kontrol et
if git diff --cached --name-only | grep -q "\.env$"; then
  echo "❌ ERROR: .env dosyası commit edilemez!"
  echo "Lütfen .gitignore'ı kontrol edin."
  exit 1
fi

exit 0
```

Çalıştırılabilir yap:
```bash
chmod +x .git/hooks/pre-commit
```

### 4. GitHub Secret Scanning

- GitHub → Settings → Code security and analysis
- "Secret scanning" aktifleştir
- Otomatik API key detection

---

## ✅ Güvenlik Best Practices

### DO ✅
- `.env.example` kullan (placeholder değerlerle)
- `.gitignore`'da `.env` var mı kontrol et
- Production'da environment variables kullan
- API keys'i düzenli rotate et
- Git commit history'yi kontrol et

### DON'T ❌
- `.env` dosyasını commit etme
- API keys'i kodda hardcode etme
- Screenshots'ta API keys gösterme
- Public repo'da `.env` paylaşma
- Slack/Discord'da API keys gönderme

---

## 📞 Yardım

Eğer yanlışlıkla API key sızdıysa:
1. Derhal key'i revoke et (iptal et)
2. Yeni key oluştur
3. Git history'den temizle
4. Yeni key'i güvenli şekilde sakla

---

## 🔍 Son Kontrol Komutu

```bash
# Tüm dosyaları tara, API pattern ara
git grep -E "(SUPABASE_KEY|GEMINI_API_KEY|JWT_SECRET)" -- ':!.env.example'

# Output OLMAMALI! Eğer varsa, o dosyaları temizle.
```

---

**Unutmayın:** Güvenlik bir kerelik değil, sürekli bir süreçtir! 🔒
