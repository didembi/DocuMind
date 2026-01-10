// DocuMind Backend API Client

import type { SummaryResponse, KeywordSearchResult, MessageSource } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const USER_ID = 'demo_user'; // MVP icin sabit user ID

export interface UploadResponse {
  id: string;
  filename: string;
  chunks_count: number;
  status: string;
}

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  file_path: string;
  status: 'processing' | 'ready' | 'failed';
  short_summary?: string;
  long_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface QueryResponse {
  query_id: string;
  question: string;
  answer: string;
  sources: MessageSource[];
}

export interface DocumentStatusResponse {
  id: string;
  filename: string;
  status: 'processing' | 'ready' | 'failed';
  ready: boolean;
}

export interface ChunkResponse {
  document_id: string;
  filename: string;
  chunk: {
    id: string;
    chunk_text: string;
    chunk_number: number;
    chunk_index: number;
    page_number: number | null;
    line_start: number | null;
    line_end: number | null;
  };
}

export const api = {
  // ==================== DOCUMENT ENDPOINTS ====================

  /**
   * Upload a document (PDF/TXT) to backend for processing
   */
  async uploadDocument(file: File): Promise<UploadResponse> {
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
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },

  /**
   * List all documents for current user
   */
  async listDocuments(): Promise<{ documents: Document[]; total: number }> {
    const response = await fetch(`${API_URL}/documents/`, {
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  },

  /**
   * Get a single document's details
   */
  async getDocument(documentId: string): Promise<Document> {
    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Document not found' }));
      throw new Error(error.detail || 'Document not found');
    }

    return response.json();
  },

  /**
   * Get document processing status
   */
  async getDocumentStatus(documentId: string): Promise<DocumentStatusResponse> {
    const response = await fetch(`${API_URL}/documents/${documentId}/status`, {
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Status check failed' }));
      throw new Error(error.detail || 'Status check failed');
    }

    return response.json();
  },

  /**
   * Generate document summary
   */
  async generateSummary(
    documentId: string,
    mode: 'short' | 'long' = 'short',
    save: boolean = false
  ): Promise<SummaryResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 dakika timeout

    try {
      const response = await fetch(
        `${API_URL}/documents/${documentId}/summary?mode=${mode}&save=${save}`,
        {
          method: 'POST',
          headers: {
            'x-user-id': USER_ID,
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Summary generation failed' }));
        throw new Error(error.detail || 'Summary generation failed');
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ozet olusturma zaman asimina ugradi. Lutfen tekrar deneyin.');
      }
      throw error;
    }
  },

  /**
   * Get a single chunk by ID (for source preview)
   */
  async getChunk(documentId: string, chunkId: string): Promise<ChunkResponse> {
    const response = await fetch(`${API_URL}/documents/${documentId}/chunks/${chunkId}`, {
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Chunk not found' }));
      throw new Error(error.detail || 'Chunk not found');
    }

    return response.json();
  },

  /**
   * Delete a document and its chunks
   */
  async deleteDocument(documentId: string): Promise<{ status: string; id: string }> {
    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Delete failed' }));
      throw new Error(error.detail || 'Delete failed');
    }

    return response.json();
  },

  // ==================== QUERY ENDPOINTS ====================

  /**
   * Ask a question about documents (semantic search)
   */
  async queryDocuments(
    question: string,
    documentIds: string[],
    searchLimit: number = 5
  ): Promise<QueryResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 dakika timeout

    try {
      const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': USER_ID,
        },
        body: JSON.stringify({
          question,
          document_ids: documentIds,
          search_limit: searchLimit,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Query failed' }));
        throw new Error(error.detail || 'Query failed');
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Istek zaman asimina ugradi. Lutfen tekrar deneyin.');
      }
      throw error;
    }
  },

  /**
   * Keyword search in a document
   */
  async keywordSearch(
    documentId: string,
    query: string,
    limit: number = 10
  ): Promise<KeywordSearchResult> {
    const response = await fetch(
      `${API_URL}/search/keyword?document_id=${encodeURIComponent(documentId)}&q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: {
          'x-user-id': USER_ID,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Keyword search failed' }));
      throw new Error(error.detail || 'Keyword search failed');
    }

    return response.json();
  },

  /**
   * Get query history
   */
  async listQueries(limit: number = 10): Promise<{ queries: any[]; total: number }> {
    const response = await fetch(`${API_URL}/queries?limit=${limit}`, {
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch queries');
    }

    return response.json();
  },

  // ==================== HEALTH CHECK ====================

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await fetch('http://localhost:8000/health');

    if (!response.ok) {
      throw new Error('Backend is down');
    }

    return response.json();
  },
};
