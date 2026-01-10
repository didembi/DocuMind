export type NotebookAccent = 'purple' | 'blue' | 'green' | 'red' | 'orange';

export type Source = {
  id: string;
  type: 'file' | 'text';
  name: string;
  preview: string;      // first 200 chars
  content: string;      // full content
  documentId?: string;  // Backend document ID (for API calls)
  status?: 'processing' | 'ready' | 'failed';  // Document processing status
  createdAt: Date;
};

export type Notebook = {
  id: string;
  title: string;
  accent?: NotebookAccent;
  sources: Source[];
  updatedAt: Date;
};

// Enhanced source type for chat messages
export type MessageSource = {
  document_id: string;
  title: string;
  chunk_id: string;
  chunk_index: number;
  page: number | null;
  line_start: number | null;
  line_end: number | null;
  similarity: number;
  preview: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: MessageSource[];
  createdAt: Date;
};

// Summary response type
export type SummaryResponse = {
  mode: 'short' | 'long';
  summary: string;
  sources: Array<{
    document_id: string;
    chunk_id: string;
    chunk_index: number;
    page: number | null;
    line_start: number | null;
    line_end: number | null;
  }>;
  cached: boolean;
};

// Document with status
export type DocumentStatus = {
  id: string;
  filename: string;
  status: 'processing' | 'ready' | 'failed';
  short_summary?: string;
  long_summary?: string;
};

// Keyword search result
export type KeywordSearchResult = {
  query: string;
  document_id: string;
  document_title: string;
  results: Array<{
    document_id: string;
    title: string;
    chunk_id: string;
    chunk_index: number;
    page: number | null;
    line_start: number | null;
    line_end: number | null;
    preview: string;
    full_text: string;
  }>;
  total: number;
};
