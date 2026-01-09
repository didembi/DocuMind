// DocuMind Backend API Client

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const USER_ID = 'demo_user'; // MVP için sabit user ID

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
  created_at: string;
  updated_at: string;
}

export interface QueryResponse {
  query_id: string;
  question: string;
  answer: string;
  sources: Array<{
    document_id: string;
    page_number: number;
    similarity: number;
  }>;
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
   * Ask a question about documents
   */
  async queryDocuments(
    question: string,
    documentIds: string[],
    searchLimit: number = 5
  ): Promise<QueryResponse> {
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
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Query failed' }));
      throw new Error(error.detail || 'Query failed');
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
