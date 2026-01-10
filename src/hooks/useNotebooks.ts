import { useState, useEffect, useCallback } from 'react';
import type { Notebook, NotebookAccent, Source } from '@/types';
import { api } from '@/services/api';

const STORAGE_KEY = 'documind_notebooks';
const SYNCED_DOCS_KEY = 'documind_synced_docs'; // Hangi belgelerin zaten senkronize edildigini takip et

// localStorage'dan notebook'lari yukle
function loadNotebooks(): Notebook[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((notebook: any) => ({
        ...notebook,
        updatedAt: new Date(notebook.updatedAt),
        sources: notebook.sources.map((source: any) => ({
          ...source,
          createdAt: new Date(source.createdAt),
        })),
      }));
    }
  } catch (error) {
    console.error('Failed to load notebooks from localStorage:', error);
  }
  return [];
}

// localStorage'a notebook'lari kaydet
function saveNotebooks(notebooks: Notebook[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks));
  } catch (error) {
    console.error('Failed to save notebooks to localStorage:', error);
  }
}

// Senkronize edilen belge ID'lerini yukle
function loadSyncedDocs(): Set<string> {
  try {
    const stored = localStorage.getItem(SYNCED_DOCS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (error) {
    console.error('Failed to load synced docs:', error);
  }
  return new Set();
}

// Senkronize edilen belge ID'lerini kaydet
function saveSyncedDocs(docs: Set<string>) {
  try {
    localStorage.setItem(SYNCED_DOCS_KEY, JSON.stringify([...docs]));
  } catch (error) {
    console.error('Failed to save synced docs:', error);
  }
}

// Renk paleti
const ACCENT_COLORS: NotebookAccent[] = ['purple', 'blue', 'green', 'red', 'orange'];

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => loadNotebooks());
  const [isLoading, setIsLoading] = useState(true);

  // Backend'den belgeleri cek ve notebook olarak ekle
  const syncFromBackend = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.listDocuments();
      const syncedDocs = loadSyncedDocs();
      const currentNotebooks = loadNotebooks();

      const newNotebooks: Notebook[] = [];

      for (const doc of response.documents) {
        // Sadece 'ready' durumundaki ve daha once eklenmemis belgeleri ekle
        if (doc.status === 'ready' && !syncedDocs.has(doc.id)) {
          // Rastgele renk sec
          const randomAccent = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

          const notebook: Notebook = {
            id: `doc-${doc.id}`, // Belge ID'si ile benzersiz notebook ID
            title: doc.filename.replace(/\.[^/.]+$/, ''), // Uzantiyi kaldir
            accent: randomAccent,
            sources: [
              {
                id: `src-${doc.id}`,
                type: doc.filename.toLowerCase().endsWith('.pdf') ? 'file' : 'text',
                name: doc.filename,
                preview: `Belge: ${doc.filename} (${Math.round((doc.file_size || 0) / 1024)} KB)`,
                content: `Document ID: ${doc.id}`,
                documentId: doc.id,
                createdAt: new Date(doc.created_at),
              },
            ],
            updatedAt: new Date(doc.updated_at || doc.created_at),
          };

          newNotebooks.push(notebook);
          syncedDocs.add(doc.id);
        }
      }

      if (newNotebooks.length > 0) {
        // Yeni notebook'lari mevcut olanlarin basina ekle
        const merged = [...newNotebooks, ...currentNotebooks];
        setNotebooks(merged);
        saveNotebooks(merged);
        saveSyncedDocs(syncedDocs);
        console.log(`[sync] ${newNotebooks.length} yeni belge senkronize edildi`);
      }
    } catch (error) {
      console.error('Failed to sync from backend:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sayfa yuklendiginde backend'den senkronize et
  useEffect(() => {
    syncFromBackend();
  }, [syncFromBackend]);

  // Notebooks degistiginde localStorage'a kaydet
  useEffect(() => {
    saveNotebooks(notebooks);
  }, [notebooks]);

  const createNotebook = (
    title: string,
    accent: NotebookAccent | undefined,
    sources: Array<{ type: 'file' | 'text'; name: string; content: string; documentId?: string }>
  ) => {
    const newNotebook: Notebook = {
      id: Date.now().toString(),
      title,
      accent,
      sources: sources.map((source, index) => ({
        id: `${Date.now()}-${index}`,
        type: source.type,
        name: source.name,
        preview: source.content.slice(0, 200),
        content: source.content,
        documentId: source.documentId,
        createdAt: new Date(),
      })),
      updatedAt: new Date(),
    };

    // Eger documentId varsa, synced docs'a ekle
    const syncedDocs = loadSyncedDocs();
    sources.forEach((s) => {
      if (s.documentId) {
        syncedDocs.add(s.documentId);
      }
    });
    saveSyncedDocs(syncedDocs);

    setNotebooks((prev) => [newNotebook, ...prev]);
    return newNotebook.id;
  };

  const deleteNotebook = (id: string) => {
    setNotebooks((prev) => prev.filter((notebook) => notebook.id !== id));
  };

  const updateNotebookTitle = (id: string, title: string) => {
    setNotebooks((prev) =>
      prev.map((notebook) =>
        notebook.id === id
          ? { ...notebook, title, updatedAt: new Date() }
          : notebook
      )
    );
  };

  const addSource = (
    notebookId: string,
    sources: Array<{ type: 'file' | 'text'; name: string; content: string; documentId?: string }>
  ) => {
    // Eger documentId varsa, synced docs'a ekle
    const syncedDocs = loadSyncedDocs();
    sources.forEach((s) => {
      if (s.documentId) {
        syncedDocs.add(s.documentId);
      }
    });
    saveSyncedDocs(syncedDocs);

    setNotebooks((prev) =>
      prev.map((notebook) => {
        if (notebook.id === notebookId) {
          const newSources: Source[] = sources.map((source, index) => ({
            id: `${Date.now()}-${index}`,
            type: source.type,
            name: source.name,
            preview: source.content.slice(0, 200),
            content: source.content,
            documentId: source.documentId,
            createdAt: new Date(),
          }));

          return {
            ...notebook,
            sources: [...notebook.sources, ...newSources],
            updatedAt: new Date(),
          };
        }
        return notebook;
      })
    );
  };

  const removeSource = (notebookId: string, sourceId: string) => {
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
  };

  const getNotebook = (id: string) => {
    return notebooks.find((notebook) => notebook.id === id);
  };

  // Manuel senkronizasyon icin
  const refreshFromBackend = () => {
    syncFromBackend();
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
