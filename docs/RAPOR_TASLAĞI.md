# DocuMind - Teknik Rapor Taslağı

## Proje Bilgileri
- **Proje Adı:** DocuMind
- **Açıklama:** AI destekli belge yönetimi ve soru-cevap platformu (NotebookLM benzeri)
- **GitHub:** [Repository Link]

---

## 1. Proje Tanımı ve Genel Bakış

DocuMind, kullanıcıların PDF ve metin belgelerini yükleyerek bu belgeler üzerinde yapay zeka destekli soru-cevap yapmasını sağlayan bir platformdur.

### Teknoloji Stack'i
| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18, TypeScript, TailwindCSS, Vite |
| Backend | FastAPI (Python) |
| Veritabanı | Supabase (PostgreSQL + pgvector) |
| LLM | Ollama (gemma3:4b) - Lokal çalışma |
| Embedding | sentence-transformers |

---

## 2. Mimari Kararlar (AI Önerisi vs İnsan Kararı)

### 2.1 Veritabanı Seçimi
| | |
|---|---|
| **AI (Claude) Önerisi** | Supabase + PostgreSQL + pgvector |
| **İnsan Kararı** | ✅ Kabul edildi |
| **Gerekçe** | Vektör araması için optimize, ücretsiz tier, kolay kurulum |

### 2.2 Frontend Framework Seçimi
| | |
|---|---|
| **AI (Claude) Önerisi** | Streamlit (hızlı prototipleme için) |
| **İnsan Kararı** | ❌ Reddedildi → React tercih edildi |
| **Gerekçe** | Zaman kısıtı, modüler yapı, takım deneyimi, ölçeklenebilirlik |

### 2.3 LLM API Seçimi
| | |
|---|---|
| **Başlangıç Planı** | Gemini API |
| **Karşılaşılan Sorun** | Token limiti doldu |
| **Nihai Karar** | Ollama (gemma3:4b) - Lokal çalışma |
| **Gerekçe** | Ücretsiz, yerel çalışma, API limiti yok |

---

## 3. Geliştirme ve Versiyonlama

### 3.1 Commit İstatistikleri
| Etiket | Sayı | Yüzde |
|--------|------|-------|
| [AI-generated] | 3 | %30 |
| [AI-assisted] | 4 | %40 |
| [Human-written] | 3 | %30 |
| **Toplam** | **10** | **%100** |

### 3.2 Commit Detayları

| Commit | Etiket | Açıklama |
|--------|--------|----------|
| 41bd010 | [AI-generated] | Database de not id'si oluşturuldu |
| 8785bb2 | [Human-written] | Documind tıklanabilir yapıldı |
| a3c749a | [AI-assisted] | Süre aşımı sorunu çözüldü ve ollama kütüphanesi güncellendi |
| b0bc981 | [Human-written] | ollama promptu güncellendi |
| 31266d8 | [AI-generated] | Database deki verileri anasayfada görüntüleme |
| e4694ed | [AI-assisted] | Ollama ile doğal dil çıktısı üretildi |
| 6396db5 | [AI-assisted] | Ollama mantığı eklendi, Gemini vazgeçildi |
| 352cd0c | [Human-written] | API-key açıkça yazılması ortadan kaldırıldı |
| adf842d | [AI-generated] | Backend yapısı oluşturuldu |
| c862c1b | [AI-assisted] | initial frontend implementation |

---

## 4. AI Decision Log (Zorunlu Tablo)

| Aşama | Kullanılan YZ | YZ Önerisi | Nihai Karar | Gerekçe |
|-------|---------------|------------|-------------|---------|
| Veritabanı Seçimi | Claude | Supabase + PostgreSQL + pgvector | Kabul | Vektör araması için optimize, ücretsiz tier, hızlı kurulum |
| Frontend Framework | Claude | Streamlit | React | Zaman kısıtı, modülerlik, takım deneyimi, uzun vadeli ölçeklenebilirlik |
| LLM Entegrasyonu | Claude | Gemini API | Ollama (lokal) | Gemini token limiti doldu, Ollama ücretsiz ve sınırsız |
| State Management | Claude | Redux | Context API | Basit state ihtiyaçları için yeterli, overengineering'den kaçınma |
| UI Kütüphanesi | Claude | shadcn/ui | Kabul | Modern, özelleştirilebilir, TailwindCSS ile uyumlu |
| Backend Framework | Claude | FastAPI | Kabul | Async desteği, otomatik dokümantasyon, Python ekosistemi |
| Embedding Model | Claude | OpenAI Ada | sentence-transformers | Lokal çalışma, ücretsiz, API bağımlılığı yok |

---

## 5. Test ve Hata Ayıklama

Bu bölümde AI (Claude) kullanılarak oluşturulan test senaryoları ve hata ayıklama süreçleri detaylı olarak açıklanmaktadır.

### 5.1 AI ile Üretilmiş Unit Testler

Aşağıdaki unit testler **Claude AI** tarafından otomatik olarak üretilmiştir. Her test dosyasının başında `AI-generated` etiketi bulunmaktadır.

#### 5.1.1 Frontend Testleri

**Dosya:** `src/__tests__/useNotebooks.test.ts`

| Test Kategorisi | Test Sayısı | Açıklama |
|-----------------|-------------|----------|
| Notebook CRUD Operations | 4 | Oluşturma, okuma, güncelleme, silme |
| Document/Source Management | 3 | Dosya yükleme, bağlama, kaldırma |
| Edge Cases | 9 | Hata durumları, sınır değerler |
| **Toplam** | **16** | |

**Örnek Test Case (AI-generated):**
```typescript
it('should handle empty notebook list', async () => {
  (api.listNotebooks as ReturnType<typeof vi.fn>).mockResolvedValue({
    notebooks: [],
    total: 0
  });

  const result = await api.listNotebooks();

  expect(result.notebooks).toHaveLength(0);
  expect(result.total).toBe(0);
});
```

**Test Kapsamı:**
- ✅ Notebook oluşturma (başarılı/başarısız)
- ✅ Notebook silme
- ✅ Başlık güncelleme
- ✅ Dosya yükleme
- ✅ Hata yönetimi (network error, timeout)
- ✅ Güvenlik (XSS, özel karakterler)

#### 5.1.2 Backend Testleri

**Dosya 1:** `documind-backend/tests/test_ollama_client.py`

| Test Kategorisi | Test Sayısı | Açıklama |
|-----------------|-------------|----------|
| generate_answer Tests | 4 | Soru-cevap fonksiyonu |
| generate_summary Tests | 4 | Özet üretimi (short/long) |
| check_health Tests | 2 | Servis sağlık kontrolü |
| Edge Cases | 5 | Hata durumları |
| **Toplam** | **15** | |

**Örnek Test Case (AI-generated):**
```python
@pytest.mark.asyncio
async def test_connection_error_handling(self, ollama_client):
    """Test handling when Ollama service is not running"""
    with patch.object(httpx.AsyncClient, 'post', new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectError("Connection refused")

        with pytest.raises(Exception) as exc_info:
            await ollama_client.generate_answer("test", "context")

        assert "Ollama servisi çalışmıyor" in str(exc_info.value)
```

**Dosya 2:** `documind-backend/tests/test_api_endpoints.py`

| Test Kategorisi | Test Sayısı | Açıklama |
|-----------------|-------------|----------|
| Document Endpoints | 6 | Upload, list, delete |
| Notebook Endpoints | 5 | CRUD operations |
| Query Endpoints | 3 | Soru-cevap API |
| Edge Cases | 4 | Güvenlik, sınır değerler |
| **Toplam** | **18** | |

### 5.2 AI ile Üretilmiş Edge-Case Senaryoları

Edge-case senaryoları, sistemin beklenmedik durumlarda nasıl davranacağını test etmek için **Claude AI** tarafından tasarlanmıştır.

#### Frontend Edge Cases

| # | Senaryo | Test Dosyası | Beklenen Davranış | AI Tarafından Üretildi |
|---|---------|--------------|-------------------|------------------------|
| 1 | Boş notebook listesi | useNotebooks.test.ts | Empty state gösterilmeli | ✅ Evet |
| 2 | Network hatası | useNotebooks.test.ts | Error message gösterilmeli | ✅ Evet |
| 3 | Çok uzun başlık (500+ karakter) | useNotebooks.test.ts | Kısaltılmalı veya reddedilmeli | ✅ Evet |
| 4 | Geçersiz renk değeri | useNotebooks.test.ts | Varsayılan renge dönmeli | ✅ Evet |
| 5 | Dosya yükleme timeout | useNotebooks.test.ts | Timeout hatası gösterilmeli | ✅ Evet |
| 6 | Eşzamanlı işlemler | useNotebooks.test.ts | Race condition olmamalı | ✅ Evet |
| 7 | XSS saldırısı | useNotebooks.test.ts | Script çalışmamalı | ✅ Evet |
| 8 | Özel karakterler | useNotebooks.test.ts | Düzgün işlenmeli | ✅ Evet |
| 9 | Notebook bulunamadı | useNotebooks.test.ts | 404 hatası döndürülmeli | ✅ Evet |

#### Backend Edge Cases

| # | Senaryo | Test Dosyası | Beklenen Davranış | AI Tarafından Üretildi |
|---|---------|--------------|-------------------|------------------------|
| 1 | Ollama servisi kapalı | test_ollama_client.py | Anlaşılır hata mesajı | ✅ Evet |
| 2 | Timeout (uzun işlem) | test_ollama_client.py | Timeout exception | ✅ Evet |
| 3 | Malformed API response | test_ollama_client.py | Graceful error handling | ✅ Evet |
| 4 | Boş context | test_ollama_client.py | Smalltalk response | ✅ Evet |
| 5 | Unicode/Türkçe içerik | test_ollama_client.py | Düzgün encoding | ✅ Evet |
| 6 | SQL Injection denemesi | test_api_endpoints.py | Saldırı engellenmeli | ✅ Evet |
| 7 | XSS in request body | test_api_endpoints.py | Sanitize edilmeli | ✅ Evet |
| 8 | Büyük dosya yükleme | test_api_endpoints.py | Size limit kontrolü | ✅ Evet |
| 9 | Missing auth header | test_api_endpoints.py | 401 veya default user | ✅ Evet |
| 10 | Concurrent requests | test_api_endpoints.py | Thread-safe çalışmalı | ✅ Evet |
| 11 | Boş soru gönderme | test_api_endpoints.py | Validation error | ✅ Evet |
| 12 | Geçersiz document ID | test_api_endpoints.py | 404 error | ✅ Evet |

### 5.3 Test Çalıştırma Komutları

```bash
# Frontend testleri (Vitest kurulumu gerekli)
npm install -D vitest @testing-library/react
npm run test

# Backend testleri
cd documind-backend
pip install pytest pytest-asyncio
pytest tests/ -v
```

---

## 6. AI Hallucination / Yanlış-Eksik Çıktı Örnekleri

Bu bölümde, geliştirme sürecinde karşılaşılan **AI'ın yanlış veya eksik ürettiği çıktılar** bilinçli olarak raporlanmıştır. Bu örnekler, AI'ın sınırlamalarını anlamak ve insan denetiminin önemini vurgulamak açısından kritik öneme sahiptir.

### 6.1 Örnek 1: Timeout Değeri Hatası (YANLIŞ ÖNERİ)

| Alan | Detay |
|------|-------|
| **Tarih** | Proje geliştirme süreci |
| **Kullanılan AI** | Claude |
| **Görev** | Ollama API için timeout ayarı |
| **AI'ın Önerisi** | 30 saniye timeout |
| **Sorun** | Büyük PDF belgeleri işlenirken sürekli timeout hatası alındı |
| **Gerçek İhtiyaç** | 300+ saniye timeout (LLM modeli yavaş çalışıyor) |
| **Tespit Yöntemi** | Manuel test sırasında keşfedildi |
| **Düzeltme** | İnsan müdahalesi ile timeout değeri artırıldı |

**AI'ın Önerdiği Kod (HATALI):**
```python
# Claude'un ilk önerisi - yetersiz timeout
timeout = httpx.Timeout(30.0)  # ❌ Büyük belgeler için yetersiz
```

**İnsan Tarafından Düzeltilen Kod (DOĞRU):**
```python
# Manuel düzeltme - gerçekçi timeout değerleri
timeout = httpx.Timeout(
    connect=10.0,    # Bağlantı için 10 saniye
    read=600.0,      # Okuma için 10 dakika
    write=600.0,     # Yazma için 10 dakika
    pool=10.0        # Pool için 10 saniye
)
```

**Öğrenilen Ders:** AI, gerçek dünya performans gereksinimlerini tahmin etmekte zorlanabilir. Özellikle donanım ve model bağımlı parametrelerde insan testi şarttır.

---

### 6.2 Örnek 2: Context Limit Tahmini (EKSİK BİLGİ)

| Alan | Detay |
|------|-------|
| **Tarih** | Proje geliştirme süreci |
| **Kullanılan AI** | Claude |
| **Görev** | LLM context window boyutu belirleme |
| **AI'ın Önerisi** | 8000 karakter context limit |
| **Sorun** | gemma3:4b modeli için fazla, yanıt üretimi çok yavaşladı |
| **Gerçek Optimal Değer** | 4000 karakter (chat), 6000 karakter (short summary) |
| **Tespit Yöntemi** | Performans testleri sırasında keşfedildi |
| **Düzeltme** | Deneme-yanılma ile optimal değerler bulundu |

**AI'ın Önerisi (SUBOPTIMAL):**
```python
# Claude'un önerisi - model için fazla iyimser
max_ctx_chars = 8000  # ❌ gemma3:4b için performans sorunu
```

**Optimize Edilmiş Değerler (DOĞRU):**
```python
# Manuel optimizasyon sonucu
max_ctx_chars_chat = 4000          # ✅ Chat için optimal
max_ctx_chars_summary_short = 6000  # ✅ Kısa özet için
max_ctx_chars_summary_long = 10000  # ✅ Uzun özet için
```

**Öğrenilen Ders:** AI, spesifik model performansını bilemez. Her model için ayrı optimizasyon gerekir.

---

### 6.3 Örnek 3: LangChain Import Path Hatası (ESKİ BİLGİ)

| Alan | Detay |
|------|-------|
| **Tarih** | Proje geliştirme süreci |
| **Kullanılan AI** | Claude |
| **Görev** | PDF işleme için LangChain entegrasyonu |
| **AI'ın Önerisi** | `from langchain.document_loaders import PyPDFLoader` |
| **Sorun** | LangChain v0.1+ sürümünde bu import path değişti |
| **Hata Mesajı** | `ImportError: cannot import name 'PyPDFLoader' from 'langchain.document_loaders'` |
| **Doğru Path** | `from langchain_community.document_loaders import PyPDFLoader` |
| **Tespit Yöntemi** | Kod çalıştırıldığında ImportError |
| **Düzeltme** | LangChain güncel dokümantasyonuna bakıldı |

**AI'ın Önerisi (ESKİ SÜRÜM):**
```python
# Claude'un önerisi - eski LangChain sürümü için
from langchain.document_loaders import PyPDFLoader  # ❌ Deprecated path
```

**Güncel Kod (DOĞRU):**
```python
# LangChain v0.1+ için güncel import
from langchain_community.document_loaders import PyPDFLoader  # ✅ Yeni path
```

**Öğrenilen Ders:** AI'ın bilgi kesim tarihi (knowledge cutoff) vardır. Hızla değişen kütüphanelerde güncel dokümantasyon kontrolü şarttır.

---

### 6.4 Örnek 4: API Key Güvenlik Açığı (GÜVENLİK HATASI)

| Alan | Detay |
|------|-------|
| **Tarih** | Commit: 352cd0c |
| **Kullanılan AI** | Claude |
| **Görev** | Backend konfigürasyon dosyası oluşturma |
| **AI'ın Önerisi** | API key'leri doğrudan kod içine yazdı |
| **Sorun** | Güvenlik açığı - API key'ler Git'e commit edilebilirdi |
| **Tespit Yöntemi** | İnsan kod incelemesi (code review) |
| **Düzeltme** | [Human-written] commit ile .env dosyasına taşındı |

**AI'ın Önerisi (GÜVENSİZ):**
```python
# Claude'un ilk önerisi - güvenlik açığı
GEMINI_API_KEY = "AIzaSy..."  # ❌ Hardcoded API key
SUPABASE_KEY = "eyJhbGciOiJI..."  # ❌ Açıkta bırakılmış
```

**Güvenli Versiyon (DOĞRU):**
```python
# İnsan müdahalesi ile düzeltildi
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # ✅ Environment variable
SUPABASE_KEY = os.getenv("SUPABASE_KEY")       # ✅ Güvenli
```

**Öğrenilen Ders:** AI güvenlik best practice'lerini her zaman uygulamayabilir. Güvenlik açısından kritik kodlar mutlaka insan tarafından incelenmeli.

---

### 6.5 Hallucination Özet Tablosu

| # | Hata Türü | Kategori | Tespit Yöntemi | Çözüm |
|---|-----------|----------|----------------|-------|
| 1 | Timeout değeri | Performans | Manuel test | İnsan düzeltmesi |
| 2 | Context limit | Optimizasyon | Performans testi | Deneme-yanılma |
| 3 | Import path | Güncellik | Runtime error | Dokümantasyon |
| 4 | API key exposure | Güvenlik | Code review | .env kullanımı |

### 6.6 AI Hallucination'dan Korunma Stratejileri

Bu projede uygulanan stratejiler:

1. **Kod İncelemesi (Code Review):** Her AI-generated commit insan tarafından kontrol edildi
2. **Test Odaklı Geliştirme:** AI çıktıları unit testlerle doğrulandı
3. **Dokümantasyon Kontrolü:** Kütüphane güncellemeleri resmi dokümantasyondan kontrol edildi
4. **Aşamalı Entegrasyon:** Büyük değişiklikler küçük parçalar halinde test edildi
5. **Güvenlik Taraması:** Hassas bilgiler (API key, credentials) için özel dikkat gösterildi

---

## 7. Etik, Güvenlik ve Lisans Değerlendirmesi

### 7.1 Kod Lisansı Riski
| Kütüphane | Lisans | Risk Seviyesi |
|-----------|--------|---------------|
| React | MIT | ✅ Düşük |
| FastAPI | MIT | ✅ Düşük |
| Supabase | Apache 2.0 | ✅ Düşük |
| Ollama | MIT | ✅ Düşük |
| sentence-transformers | Apache 2.0 | ✅ Düşük |
| TailwindCSS | MIT | ✅ Düşük |

**Değerlendirme:** Tüm kullanılan kütüphaneler açık kaynak ve ticari kullanıma uygun lisanslara sahiptir. Herhangi bir copyleft (GPL) lisansı kullanılmamıştır.

### 7.2 Veri Gizliliği
| Konu | Durum | Açıklama |
|------|-------|----------|
| Kullanıcı verileri | ⚠️ Dikkat | Supabase'de şifrelenmemiş saklanıyor |
| Belgeler | ⚠️ Dikkat | Sunucu tarafında işleniyor |
| API anahtarları | ✅ Güvenli | .env dosyasında, Git'e eklenmedi |
| LLM işleme | ✅ Güvenli | Ollama lokal çalışıyor, veri dışarı gitmiyor |

**Öneriler:**
- Supabase Row Level Security (RLS) aktifleştirilmeli
- Belge içerikleri şifrelenmeli
- HTTPS zorunlu hale getirilmeli

### 7.3 Güvenlik Açıkları
| Açık Türü | Durum | Açıklama |
|-----------|-------|----------|
| SQL Injection | ✅ Korumalı | Supabase ORM kullanılıyor |
| XSS | ⚠️ Kısmi | React varsayılan koruma, ek sanitization önerilir |
| CSRF | ⚠️ Dikkat | Token kontrolü eklenmeli |
| File Upload | ⚠️ Dikkat | Dosya tipi kontrolü var, ama genişletilebilir |

### 7.4 AI Hallucination Riskleri
- LLM çıktıları %100 güvenilir değil
- Kritik kararlar için insan onayı gerekli
- Kaynak gösterimi (📄 Kaynak:) ile doğrulama destekleniyor
- Yanıltıcı bilgi üretme riski var - disclaimer eklenmeli

---

## 8. Sonuç ve Öneriler

### Yapılan İşler
- ✅ React + TypeScript frontend
- ✅ FastAPI backend
- ✅ Supabase veritabanı entegrasyonu
- ✅ Ollama LLM entegrasyonu
- ✅ PDF işleme ve chunking
- ✅ Vektör tabanlı arama
- ✅ AI ile unit test oluşturma

### Gelecek Öneriler
- [ ] Authentication sistemi (Supabase Auth)
- [ ] Rate limiting
- [ ] Caching mekanizması
- [ ] Daha fazla dosya formatı desteği
- [ ] Streaming responses
- [ ] Multi-language support

---

**Rapor Tarihi:** Ocak 2026
**Hazırlayanlar:** [Grup Üyeleri]
**AI Asistan:** Claude (Anthropic)
