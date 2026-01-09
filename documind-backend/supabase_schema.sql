-- DocuMind RAG Database Schema
-- Run this in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_size INTEGER,
    file_path TEXT,
    status TEXT DEFAULT 'processing',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks with embeddings (384 dimensions for all-MiniLM-L6-v2)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_number INTEGER NOT NULL,
    page_number INTEGER DEFAULT 0,
    embedding vector(384),  -- Sentence-Transformers all-MiniLM-L6-v2
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queries history
CREATE TABLE IF NOT EXISTS queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    question TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function for similarity search
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
    page_number int,
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
        dc.page_number,
        1 - (dc.embedding <=> query_embedding) as similarity
    FROM document_chunks dc
    WHERE dc.document_id = ANY(filter_document_ids)
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- RLS policies (optional but recommended)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (MVP)
CREATE POLICY "Allow all for documents" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all for document_chunks" ON document_chunks FOR ALL USING (true);
CREATE POLICY "Allow all for queries" ON queries FOR ALL USING (true);
