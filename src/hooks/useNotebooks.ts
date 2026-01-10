import { useState, useEffect, useCallback } from 'react';
import type { Notebook, NotebookAccent, Source } from '@/types';
import { api } from '@/services/api';
import type { NotebookResponse, Document } from '@/services/api';

// Renk paleti
const ACCENT_COLORS: NotebookAccent[] = ['purple', 'blue', 'green', 'red', 'orange'];

// Backend NotebookResponse'u frontend Notebook tipine donustur
function mapNotebookResponse(response: NotebookResponse): Notebook {
  const sources: Source[] = (response.documents || []).map((doc: Document) => ({
    id: `src-${doc.id}`,
    type: doc.filename.toLowerCase().endsWith('.pdf') ? 'file' : 'text',
    name: doc.filename,
    preview: `Belge: ${doc.filename} (${Math.round((doc.file_size || 0) / 1024)} KB)`,
    content: `Document ID: ${doc.id}`,
    documentId: doc.id,
    status: doc.status,
    createdAt: new Date(doc.created_at),
  }));

  return {
    id: response.id,
    title: response.title,
    accent: response.accent,
    sources,
    updatedAt: new Date(response.updated_at),
  };
}

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Backend'den notebook'lari cek
  const fetchNotebooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.listNotebooks();

      // Her notebook icin detaylari al (documents dahil)
      const notebooksWithDocs = await Promise.all(
        response.notebooks.map(async (nb) => {
          try {
            const fullNotebook = await api.getNotebook(nb.id);
            return mapNotebookResponse(fullNotebook);
          } catch {
            // Eger detay alinamazsa, basit notebook dondur
            return mapNotebookResponse({ ...nb, documents: [] });
          }
        })
      );

      setNotebooks(notebooksWithDocs);
    } catch (error) {
      console.error('Failed to fetch notebooks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sayfa yuklendiginde backend'den cek
  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  const createNotebook = async (
    title: string,
    accent: NotebookAccent | undefined,
    sources: Array<{ type: 'file' | 'text'; name: string; content: string; documentId?: string; file?: File }>
  ): Promise<string> => {
    try {
      // Rastgele renk sec eger belirtilmemisse
      const notebookAccent = accent || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

      // Backend'de notebook olustur
      const response = await api.createNotebook(title, notebookAccent);
      const notebookId = response.id;

      // Dosyalari yukle ve notebook'a bagla
      for (const source of sources) {
        if (source.file) {
          try {
            await api.uploadDocument(source.file, notebookId);
          } catch (error) {
            console.error('Failed to upload document:', error);
          }
        } else if (source.documentId) {
          // Mevcut belgeyi notebook'a bagla
          try {
            await api.addDocumentToNotebook(notebookId, source.documentId);
          } catch (error) {
            console.error('Failed to link document:', error);
          }
        }
      }

      // Notebook listesini guncelle
      await fetchNotebooks();

      return notebookId;
    } catch (error) {
      console.error('Failed to create notebook:', error);
      throw error;
    }
  };

  const deleteNotebook = async (id: string) => {
    try {
      await api.deleteNotebook(id);
      setNotebooks((prev) => prev.filter((notebook) => notebook.id !== id));
    } catch (error) {
      console.error('Failed to delete notebook:', error);
      throw error;
    }
  };

  const updateNotebookTitle = async (id: string, title: string) => {
    try {
      await api.updateNotebook(id, { title });
      setNotebooks((prev) =>
        prev.map((notebook) =>
          notebook.id === id
            ? { ...notebook, title, updatedAt: new Date() }
            : notebook
        )
      );
    } catch (error) {
      console.error('Failed to update notebook:', error);
      throw error;
    }
  };

  const addSource = async (
    notebookId: string,
    sources: Array<{ type: 'file' | 'text'; name: string; content: string; documentId?: string; file?: File }>
  ) => {
    try {
      for (const source of sources) {
        if (source.file) {
          // Yeni dosya yukle ve notebook'a bagla
          await api.uploadDocument(source.file, notebookId);
        } else if (source.documentId) {
          // Mevcut belgeyi notebook'a bagla
          await api.addDocumentToNotebook(notebookId, source.documentId);
        }
      }

      // Notebook listesini guncelle
      await fetchNotebooks();
    } catch (error) {
      console.error('Failed to add source:', error);
      throw error;
    }
  };

  const removeSource = async (notebookId: string, sourceId: string) => {
    try {
      // sourceId formatı: "src-{documentId}"
      const documentId = sourceId.replace('src-', '');
      await api.removeDocumentFromNotebook(notebookId, documentId);

      setNotebooks((prev) =>
        prev.map((notebook) => {
          if (notebook.id === notebookId) {
            return {
              ...notebook,
              sources: notebook.sources.filter((source) => source.id !== sourceId),
              updatedAt: new Date(),
            };
          }
          return notebook;
        })
      );
    } catch (error) {
      console.error('Failed to remove source:', error);
      throw error;
    }
  };

  const getNotebook = (id: string) => {
    return notebooks.find((notebook) => notebook.id === id);
  };

  // Manuel senkronizasyon icin
  const refreshFromBackend = () => {
    fetchNotebooks();
  };

  return {
    notebooks,
    isLoading,
    createNotebook,
    deleteNotebook,
    updateNotebookTitle,
    addSource,
    removeSource,
    getNotebook,
    refreshFromBackend,
  };
}
