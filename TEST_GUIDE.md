# DocuMind Test Rehberi ve Bilincli Hata Senaryosu

## Kurulum Adimlari

### 1. Backend Kurulumu

```bash
cd documind-backend

# Virtual environment olustur (Windows)
python -m venv venv
venv\Scripts\activate

# Bagimliliklari yukle
pip install -r requirements.txt

# .env dosyasini kontrol et (API key'ler .gitignore'da olmali)
```

### 2. Veritabani Migration

Supabase SQL Editor'de asagidaki SQL'leri calistirin:

1. Oncelikle mevcut `supabase_schema.sql` dosyasini calistirin (eger daha once calistirmadiyseniz)

2. Ardindan yeni migration'i calistirin:
```bash
# migrations/001_add_summary_and_location.sql dosyasinin icerigini
# Supabase SQL Editor'de calistirin
```

### 3. Ollama Kurulumu

```bash
# Ollama'yi baslat
ollama serve

# Model indir (farkli terminalde)
ollama pull gemma3:4b
# veya
ollama pull mistral
```

### 4. Backend'i Baslat

```bash
cd documind-backend
python -m uvicorn app.main:app --reload
```

Backend http://localhost:8000 adresinde calisacak.

### 5. Frontend'i Baslat

```bash
# Proje ana dizininde
npm install
npm run dev
```

Frontend http://localhost:5173 adresinde calisacak.

---

## API Test Adimlari

### Test 1: Belge Yukleme

```bash
# PDF veya TXT dosyasi yukle
curl -X POST "http://localhost:8000/api/v1/documents/upload" \
  -H "x-user-id: demo_user" \
  -F "file=@test_document.pdf"
```

**Beklenen Yanit:**
```json
{
  "id": "uuid-string",
  "filename": "test_document.pdf",
  "chunks_count": 5,
  "status": "ready"
}
```

### Test 2: Belge Durumu Kontrol

```bash
curl -X GET "http://localhost:8000/api/v1/documents/{document_id}/status" \
  -H "x-user-id: demo_user"
```

**Beklenen Yanit:**
```json
{
  "id": "uuid-string",
  "filename": "test_document.pdf",
  "status": "ready",
  "ready": true
}
```

### Test 3: Semantik Soru Sorma

```bash
curl -X POST "http://localhost:8000/api/v1/query" \
  -H "Content-Type: application/json" \
  -H "x-user-id: demo_user" \
  -d '{
    "question": "Bu belgenin ana konusu nedir?",
    "document_ids": ["document-uuid"],
    "search_limit": 5
  }'
```

**Beklenen Yanit:**
```json
{
  "query_id": "uuid-string",
  "question": "Bu belgenin ana konusu nedir?",
  "answer": "Belgenin ana konusu...",
  "sources": [
    {
      "document_id": "uuid",
      "title": "test_document.pdf",
      "chunk_id": "uuid",
      "chunk_index": 0,
      "page": 1,
      "line_start": null,
      "line_end": null,
      "similarity": 0.85,
      "preview": "Belge icerigi onizlemesi..."
    }
  ]
}
```

### Test 4: Kisa Ozet Olusturma

```bash
curl -X POST "http://localhost:8000/api/v1/documents/{document_id}/summary?mode=short&save=true" \
  -H "x-user-id: demo_user"
```

**Beklenen Yanit:**
```json
{
  "mode": "short",
  "summary": "Bu belge... ozeti\n\n• Madde 1\n• Madde 2\n...",
  "sources": [...],
  "cached": false
}
```

### Test 5: Detayli Ozet Olusturma

```bash
curl -X POST "http://localhost:8000/api/v1/documents/{document_id}/summary?mode=long&save=true" \
  -H "x-user-id: demo_user"
```

### Test 6: Anahtar Kelime Aramasi

```bash
curl -X GET "http://localhost:8000/api/v1/search/keyword?document_id={document_id}&q=aranacak_kelime&limit=10" \
  -H "x-user-id: demo_user"
```

**Beklenen Yanit:**
```json
{
  "query": "aranacak_kelime",
  "document_id": "uuid",
  "document_title": "test_document.pdf",
  "results": [
    {
      "document_id": "uuid",
      "title": "test_document.pdf",
      "chunk_id": "uuid",
      "chunk_index": 2,
      "page": 3,
      "line_start": null,
      "line_end": null,
      "preview": "...bulunan **aranacak_kelime** icerigi...",
      "full_text": "Tam chunk metni..."
    }
  ],
  "total": 1
}
```

---

## Frontend Test Adimlari

1. **Yeni Notebook Olusturma**
   - Ana sayfada "Yeni Notebook" butonuna tiklayin
   - Baslik girin ve bir PDF/TXT yukleyin
   - Yukleme tamamlaninca notebook'a yonlendirilirsiniz

2. **Ozet Butonlari Test**
   - Chat alaninda "Kisa Ozet" butonuna tiklayin
   - Cevap gelene kadar bekleyin (loading gosterilmeli)
   - "Detayli Ozet" butonunu deneyin

3. **Arama Modu Degistirme**
   - "Anlamsal" ve "Anahtar Kelime" toggle'ini test edin
   - Her iki modda da arama yapin

4. **Kaynak Gosterimi**
   - AI cevabi altindaki "X kaynak" butonuna tiklayin
   - Kaynaklari genisletin
   - Bir kaynaga tiklayinca modal acilmali

5. **Status Kontrol**
   - Belge yuklenirken "Belgeler hazirlaniyor..." mesaji gorunmeli
   - Hazir olana kadar butonlar disable olmali

---

## BILINCLI YANLIS/EKSIK AI CIKTISI SENARYOSU

### Senaryo: "Hallucination - Belgede Olmayan Bilgi Uretme"

**Amac:** AI'in bazen belgede olmayan bilgileri "uydurabilecegini" gostermek.

**Adimlar:**

1. **Hazirlik:**
   - Cok kisa, kisitli icerikli bir belge yukleyin (ornegin sadece 2 cumlelik bir TXT dosyasi)
   - Belge icerigi: "Ahmet 25 yasindadir. Ahmet Istanbul'da yasiyour."

2. **Test Sorusu:**
   - AI'a sorun: "Ahmet'in mesleği nedir ve nerede calisiyor?"

3. **Beklenen Sorunlu Cikti:**
   - AI, belgede bu bilgi olmamasina ragmen bir meslek uydurabilir
   - Ornek yanlis cikti: "Ahmet muhendis olarak calisiyour ve bir teknoloji sirketinde gorev yapiyor."

4. **Dogru Davranis:**
   - AI sunun gibi bir cevap vermeli: "Bu soruya verilen belgeler uzerinden cevap veremiyorum. Belgede Ahmet'in meslegi veya calistigi yer hakkinda bilgi bulunmamaktadir."

**Rapora Nasil Konulacagi:**

```markdown
## AI Ciktisi Hatasi Ornegi

### Test Senaryosu
- **Yuklenen Belge:** test_minimal.txt
- **Belge Icerigi:** "Ahmet 25 yasindadir. Ahmet Istanbul'da yasiyor."
- **Sorulan Soru:** "Ahmet'in meslegi nedir ve nerede calisiyor?"

### AI Ciktisi (Hatali)
"Ahmet bir yazilim muhendisi olarak calisiyour ve Istanbul'daki bir
teknoloji sirketinde gorev yapmaktadir."

### Neden Hatali?
- Belgede Ahmet'in meslegi hakkinda HIC BIR bilgi bulunmamaktadir
- AI, soruya cevap verebilmek icin olmayan bilgiyi "uydurmustur" (hallucination)
- Bu, RAG sistemlerinin bilinen bir sorunudur

### Dogru Davranis Olmali
"Belgede Ahmet'in meslegi veya is yeri hakkinda bilgi bulunmamaktadir.
Sadece yasinin 25 oldugunu ve Istanbul'da yasadigini biliyoruz."

### Ekran Goruntusu
[Buraya hallucination gosteren ekran goruntusu ekleyin]

### Cozum Onerileri
1. System prompt'a "Belgede olmayan bilgiyi ASLA uydurma" talimatini guclendir
2. Similarity threshold'u yukselt (ornegin 0.3'ten 0.5'e)
3. Kullaniciya "Bu bilgi belgede bulunamadi" uyarisi goster
```

### Alternatif Senaryo: "Yanlis Kaynak Atifi"

**Test:**
1. Birden fazla belge yukleyin (A.pdf ve B.pdf)
2. "A belgesinde ne yaziyor?" diye sorun
3. AI, B belgesinden bilgi verip A belgesine atif yapabilir

**Rapora Nasil Konulacagi:**
- Ekran goruntusu alin
- Sources[] dizisindeki document_id'leri kontrol edin
- Yanlis atifı belgeleyin

---

## Proje Dosya Yapisi (Degisiklikler)

### Backend Degisiklikleri

| Dosya | Degisiklik |
|-------|------------|
| `migrations/001_add_summary_and_location.sql` | YENI - DB migration |
| `app/services/pdf_processor.py` | line_start/line_end metadata eklendi |
| `app/services/supabase_vector.py` | keyword_search, get_document_chunks, save_summary eklendi |
| `app/services/ollama_client.py` | generate_summary fonksiyonu eklendi |
| `app/routes/documents.py` | summary, status, chunks endpoint'leri eklendi |
| `app/routes/queries.py` | keyword search endpoint, enhanced sources eklendi |

### Frontend Degisiklikleri

| Dosya | Degisiklik |
|-------|------------|
| `src/types/index.ts` | MessageSource, SummaryResponse tipleri eklendi |
| `src/services/api.ts` | generateSummary, keywordSearch, getDocumentStatus eklendi |
| `src/components/notebook/MessageBubble.tsx` | Sources UI eklendi |
| `src/components/notebook/Composer.tsx` | Ozet butonlari ve search toggle eklendi |
| `src/components/notebook/ChatLayout.tsx` | Yeni props destegi |
| `src/pages/Notebook.tsx` | Tum yeni ozellikler entegre edildi |

---

## Onemli Notlar

1. **API Key'ler:** Tum API key'ler `.env` dosyasinda tutulmali ve `.gitignore`'a eklenmeli
2. **Windows Ortami:** Tum komutlar Windows uyumlu verilmistir
3. **Local LLM:** Ollama kullanildigi icin internet baglantisi gerekmez (model indirildikten sonra)
4. **Veritabani:** Supabase cloud kullaniliyor, yerel PostgreSQL gerekmez
