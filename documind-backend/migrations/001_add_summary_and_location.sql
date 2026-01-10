-- DocuMind Migration 001: Add Summary and Location Features
-- Run this in Supabase SQL Editor after initial schema

-- ============================================
-- 1. Add summary fields to documents table
-- ============================================
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS short_summary TEXT,
ADD COLUMN IF NOT EXISTS long_summary TEXT;

-- ============================================
-- 2. Add location metadata to document_chunks
-- ============================================
ALTER TABLE document_chunks
ADD COLUMN IF NOT EXISTS line_start INTEGER,
ADD COLUMN IF NOT EXISTS line_end INTEGER,
ADD COLUMN IF NOT EXISTS chunk_index INTEGER;

-- Update existing chunks to have chunk_index from chunk_number
UPDATE document_chunks SET chunk_index = chunk_number WHERE chunk_index IS NULL;

-- ============================================
-- 3. OPSIYONEL: pg_trgm index (hizli ILIKE icin)
-- ============================================
-- NOT: Bu bolum opsiyoneldir. Hata alirsaniz atlayabilirsiniz.
-- ILIKE aramalari index olmadan da calisir, sadece buyuk verilerde yavas olur.
-- Supabase'de pg_trgm genellikle "extensions" schema'sinda yuklenir.

-- Eger pg_trgm index istiyorsaniz, Supabase Dashboard > Database > Extensions
-- bolumunden "pg_trgm" extension'ini etkinlestirin, sonra asagidaki index'i calistirin:
-- CREATE INDEX IF NOT EXISTS document_chunks_content_trgm_idx
-- ON document_chunks USING gin (chunk_text gin_trgm_ops);

-- ============================================
-- 4. Update match_document_chunks function
-- ============================================
DROP FUNCTION IF EXISTS match_document_chunks(vector(384), float, int, uuid[]);

CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    filter_document_ids uuid[]
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    chunk_text text,
    chunk_number int,
    chunk_index int,
    page_number int,
    line_start int,
    line_end int,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.chunk_text,
        dc.chunk_number,
        dc.chunk_index,
        dc.page_number,
        dc.line_start,
        dc.line_end,
        1 - (dc.embedding <=> query_embedding) as similarity
    FROM document_chunks dc
    WHERE dc.document_id = ANY(filter_document_ids)
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================
-- 5. Create keyword search function
-- ============================================
CREATE OR REPLACE FUNCTION keyword_search_chunks(
    search_query text,
    filter_document_id uuid,
    result_limit int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    chunk_text text,
    chunk_number int,
    chunk_index int,
    page_number int,
    line_start int,
    line_end int
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.chunk_text,
        dc.chunk_number,
        dc.chunk_index,
        dc.page_number,
        dc.line_start,
        dc.line_end
    FROM document_chunks dc
    WHERE dc.document_id = filter_document_id
      AND dc.chunk_text ILIKE '%' || search_query || '%'
    ORDER BY dc.chunk_number
    LIMIT result_limit;
END;
$$;

-- ============================================
-- 6. Create function to get all chunks for a document (for summarization)
-- ============================================
CREATE OR REPLACE FUNCTION get_document_chunks(
    target_document_id uuid
)
RETURNS TABLE (
    id uuid,
    chunk_text text,
    chunk_number int,
    chunk_index int,
    page_number int,
    line_start int,
    line_end int
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.chunk_text,
        dc.chunk_number,
        dc.chunk_index,
        dc.page_number,
        dc.line_start,
        dc.line_end
    FROM document_chunks dc
    WHERE dc.document_id = target_document_id
    ORDER BY dc.chunk_number;
END;
$$;

-- ============================================
-- 7. Update document summary function
-- ============================================
CREATE OR REPLACE FUNCTION update_document_summary(
    target_document_id uuid,
    new_short_summary text DEFAULT NULL,
    new_long_summary text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE documents
    SET
        short_summary = COALESCE(new_short_summary, short_summary),
        long_summary = COALESCE(new_long_summary, long_summary),
        updated_at = NOW()
    WHERE id = target_document_id;
END;
$$;
