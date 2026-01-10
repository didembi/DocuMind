// DocuMind Backend API Client

import type { SummaryResponse, KeywordSearchResult, MessageSource, NotebookAccent } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const USER_ID = 'demo_user'; // MVP icin sabit user ID

export interface UploadResponse {
  id: string;
  filename: string;
  chunks_count: number;
  status: string;
}

// Notebook Types
export interface NotebookResponse {
  id: string;
  user_id: string;
  title: string;
  accent: NotebookAccent;
  created_at: string;
  updated_at: string;
  document_count?: number;
  documents?: Document[];
}

export interface ChatMessageResponse {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: MessageSource[] | null;
  created_at: string;
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
  async uploadDocument(file: File, notebookId?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const url = notebookId
      ? `${API_URL}/documents/upload?notebook_id=${notebookId}`
      : `${API_URL}/documents/upload`;

    const response = await fetch(url, {
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
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 dakika timeout

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

  async queryDocuments(
    question: string,
    documentIds: string[],
    searchLimit: number = 5
  ): Promise<QueryResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 dakika timeout

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

  // ==================== NOTEBOOK ENDPOINTS ====================

  /**
   * Create a new notebook
   */
  async createNotebook(title: string, accent: NotebookAccent = 'purple'): Promise<NotebookResponse> {
    const response = await fetch(`${API_URL}/notebooks/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': USER_ID,
      },
      body: JSON.stringify({ title, accent }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to create notebook' }));
      throw new Error(error.detail || 'Failed to create notebook');
    }

    return response.json();
  },

  /**
   * List all notebooks for current user
   */
  async listNotebooks(): Promise<{ notebooks: NotebookResponse[]; total: number }> {
    const response = await fetch(`${API_URL}/notebooks/`, {
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notebooks');
    }

    return response.json();
  },

  /**
   * Get a single notebook with its documents
   */
  async getNotebook(notebookId: string): Promise<NotebookResponse> {
    const response = await fetch(`${API_URL}/notebooks/${notebookId}`, {
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Notebook not found' }));
      throw new Error(error.detail || 'Notebook not found');
    }

    return response.json();
  },

  /**
   * Update notebook title or accent
   */
  async updateNotebook(
    notebookId: string,
    updates: { title?: string; accent?: NotebookAccent }
  ): Promise<NotebookResponse> {
    const response = await fetch(`${API_URL}/notebooks/${notebookId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': USER_ID,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update notebook' }));
      throw new Error(error.detail || 'Failed to update notebook');
    }

    return response.json();
  },

  /**
   * Delete a notebook
   */
  async deleteNotebook(notebookId: string): Promise<{ status: string; id: string }> {
    const response = await fetch(`${API_URL}/notebooks/${notebookId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete notebook' }));
      throw new Error(error.detail || 'Failed to delete notebook');
    }

    return response.json();
  },

  /**
   * Add a document to a notebook
   */
  async addDocumentToNotebook(notebookId: string, documentId: string): Promise<{ status: string }> {
    const response = await fetch(`${API_URL}/notebooks/${notebookId}/documents/${documentId}`, {
      method: 'POST',
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to add document' }));
      throw new Error(error.detail || 'Failed to add document');
    }

    return response.json();
  },

  /**
   * Remove a document from a notebook
   */
  async removeDocumentFromNotebook(notebookId: string, documentId: string): Promise<{ status: string }> {
    const response = await fetch(`${API_URL}/notebooks/${notebookId}/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to remove document' }));
      throw new Error(error.detail || 'Failed to remove document');
    }

    return response.json();
  },

  // ==================== CHAT MESSAGE ENDPOINTS ====================

  /**
   * Get chat messages for a notebook
   */
  async getNotebookMessages(notebookId: string, limit: number = 100): Promise<{ messages: ChatMessageResponse[]; total: number }> {
    const response = await fetch(`${API_URL}/notebooks/${notebookId}/messages?limit=${limit}`, {
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch messages' }));
      throw new Error(error.detail || 'Failed to fetch messages');
    }

    return response.json();
  },

  /**
   * Save a chat message to a notebook
   */
  async saveMessage(
    notebookId: string,
    role: 'user' | 'assistant',
    content: string,
    sources?: MessageSource[]
  ): Promise<ChatMessageResponse> {
    const response = await fetch(`${API_URL}/notebooks/${notebookId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': USER_ID,
      },
      body: JSON.stringify({ role, content, sources }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to save message' }));
      throw new Error(error.detail || 'Failed to save message');
    }

    return response.json();
  },

  /**
   * Clear all messages in a notebook
   */
  async clearMessages(notebookId: string): Promise<{ status: string }> {
    const response = await fetch(`${API_URL}/notebooks/${notebookId}/messages`, {
      method: 'DELETE',
      headers: {
        'x-user-id': USER_ID,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to clear messages' }));
      throw new Error(error.detail || 'Failed to clear messages');
    }

    return response.json();
  },

  // ==================== HEALTH CHECK ====================

  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await fetch('http://localhost:8000/health');

    if (!response.ok) {
      throw new Error('Backend is down');
    }

    return response.json();
  },
};
