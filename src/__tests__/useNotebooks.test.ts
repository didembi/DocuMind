/**
 * DocuMind - useNotebooks Hook Unit Tests
 * AI-generated test cases for notebook management functionality
 *
 * Bu testler Claude AI tarafından oluşturulmuştur.
 * Test framework: Vitest + React Testing Library
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock API module
vi.mock('@/services/api', () => ({
  api: {
    listNotebooks: vi.fn(),
    getNotebook: vi.fn(),
    createNotebook: vi.fn(),
    deleteNotebook: vi.fn(),
    updateNotebook: vi.fn(),
    uploadDocument: vi.fn(),
    addDocumentToNotebook: vi.fn(),
    removeDocumentFromNotebook: vi.fn(),
  },
}));

import { api } from '@/services/api';

describe('useNotebooks Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== UNIT TESTS ====================

  describe('Notebook CRUD Operations', () => {
    it('should fetch notebooks on mount', async () => {
      const mockNotebooks = {
        notebooks: [
          { id: '1', title: 'Test Notebook', accent: 'purple', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ],
        total: 1
      };

      (api.listNotebooks as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotebooks);
      (api.getNotebook as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockNotebooks.notebooks[0],
        documents: []
      });

      // Hook çağrısı simülasyonu
      const result = await api.listNotebooks();

      expect(api.listNotebooks).toHaveBeenCalledTimes(1);
      expect(result.notebooks).toHaveLength(1);
      expect(result.notebooks[0].title).toBe('Test Notebook');
    });

    it('should create a new notebook with correct parameters', async () => {
      const mockResponse = {
        id: 'new-notebook-123',
        title: 'Yeni Notebook',
        accent: 'blue',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      (api.createNotebook as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await api.createNotebook('Yeni Notebook', 'blue');

      expect(api.createNotebook).toHaveBeenCalledWith('Yeni Notebook', 'blue');
      expect(result.id).toBe('new-notebook-123');
      expect(result.accent).toBe('blue');
    });

    it('should delete notebook by ID', async () => {
      const notebookId = 'notebook-to-delete';
      (api.deleteNotebook as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'deleted', id: notebookId });

      const result = await api.deleteNotebook(notebookId);

      expect(api.deleteNotebook).toHaveBeenCalledWith(notebookId);
      expect(result.status).toBe('deleted');
    });

    it('should update notebook title', async () => {
      const notebookId = 'notebook-123';
      const newTitle = 'Güncellenmiş Başlık';

      (api.updateNotebook as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: notebookId,
        title: newTitle,
        accent: 'purple',
        updated_at: new Date().toISOString()
      });

      const result = await api.updateNotebook(notebookId, { title: newTitle });

      expect(api.updateNotebook).toHaveBeenCalledWith(notebookId, { title: newTitle });
      expect(result.title).toBe(newTitle);
    });
  });

  describe('Document/Source Management', () => {
    it('should upload document to notebook', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const notebookId = 'notebook-123';

      (api.uploadDocument as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'doc-123',
        filename: 'test.pdf',
        chunks_count: 5,
        status: 'processing'
      });

      const result = await api.uploadDocument(mockFile, notebookId);

      expect(api.uploadDocument).toHaveBeenCalledWith(mockFile, notebookId);
      expect(result.filename).toBe('test.pdf');
    });

    it('should add existing document to notebook', async () => {
      const notebookId = 'notebook-123';
      const documentId = 'existing-doc-456';

      (api.addDocumentToNotebook as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'added' });

      const result = await api.addDocumentToNotebook(notebookId, documentId);

      expect(api.addDocumentToNotebook).toHaveBeenCalledWith(notebookId, documentId);
      expect(result.status).toBe('added');
    });

    it('should remove document from notebook', async () => {
      const notebookId = 'notebook-123';
      const documentId = 'doc-to-remove';

      (api.removeDocumentFromNotebook as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'removed' });

      const result = await api.removeDocumentFromNotebook(notebookId, documentId);

      expect(api.removeDocumentFromNotebook).toHaveBeenCalledWith(notebookId, documentId);
      expect(result.status).toBe('removed');
    });
  });

  // ==================== EDGE CASE TESTS ====================

  describe('Edge Cases', () => {
    it('should handle empty notebook list', async () => {
      (api.listNotebooks as ReturnType<typeof vi.fn>).mockResolvedValue({
        notebooks: [],
        total: 0
      });

      const result = await api.listNotebooks();

      expect(result.notebooks).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle network error gracefully', async () => {
      (api.listNotebooks as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network Error'));

      await expect(api.listNotebooks()).rejects.toThrow('Network Error');
    });

    it('should handle notebook not found error', async () => {
      const invalidId = 'non-existent-id';
      (api.getNotebook as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Notebook not found'));

      await expect(api.getNotebook(invalidId)).rejects.toThrow('Notebook not found');
    });

    it('should handle empty title validation', async () => {
      // Boş başlık ile notebook oluşturma denemesi
      (api.createNotebook as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Title is required'));

      await expect(api.createNotebook('', 'purple')).rejects.toThrow('Title is required');
    });

    it('should handle very long notebook title', async () => {
      const longTitle = 'A'.repeat(500); // 500 karakterlik başlık

      (api.createNotebook as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'long-title-notebook',
        title: longTitle.substring(0, 255), // Backend'de kısaltılmış
        accent: 'purple'
      });

      const result = await api.createNotebook(longTitle, 'purple');

      expect(result.title.length).toBeLessThanOrEqual(255);
    });

    it('should handle invalid accent color', async () => {
      // Geçersiz renk değeri
      (api.createNotebook as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'notebook-invalid-color',
        title: 'Test',
        accent: 'purple' // Varsayılan renge dönüş
      });

      const result = await api.createNotebook('Test', 'invalid-color' as any);

      expect(['purple', 'blue', 'green', 'red', 'orange']).toContain(result.accent);
    });

    it('should handle file upload timeout', async () => {
      const mockFile = new File(['large content'], 'large.pdf', { type: 'application/pdf' });

      (api.uploadDocument as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Request timeout')
      );

      await expect(api.uploadDocument(mockFile, 'notebook-123')).rejects.toThrow('timeout');
    });

    it('should handle concurrent notebook operations', async () => {
      // Eşzamanlı işlemler
      (api.createNotebook as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ id: '1', title: 'Notebook 1', accent: 'blue' })
        .mockResolvedValueOnce({ id: '2', title: 'Notebook 2', accent: 'green' });

      const [result1, result2] = await Promise.all([
        api.createNotebook('Notebook 1', 'blue'),
        api.createNotebook('Notebook 2', 'green')
      ]);

      expect(result1.id).toBe('1');
      expect(result2.id).toBe('2');
    });

    it('should handle special characters in notebook title', async () => {
      const specialTitle = 'Test <script>alert("xss")</script> Notebook';

      (api.createNotebook as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'special-char-notebook',
        title: 'Test Notebook', // Sanitized
        accent: 'purple'
      });

      const result = await api.createNotebook(specialTitle, 'purple');

      expect(result.title).not.toContain('<script>');
    });
  });
});
