import { useState } from 'react';
import type { Notebook, NotebookAccent, Source } from '@/types';
import { INITIAL_NOTEBOOKS } from '@/data/seed';

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);

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
        documentId: source.documentId, // Backend document ID
        createdAt: new Date(),
      })),
      updatedAt: new Date(),
    };

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
    setNotebooks((prev) =>
      prev.map((notebook) => {
        if (notebook.id === notebookId) {
          const newSources: Source[] = sources.map((source, index) => ({
            id: `${Date.now()}-${index}`,
            type: source.type,
            name: source.name,
            preview: source.content.slice(0, 200),
            content: source.content,
            documentId: source.documentId, // Backend document ID
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

  return {
    notebooks,
    createNotebook,
    deleteNotebook,
    updateNotebookTitle,
    addSource,
    removeSource,
    getNotebook,
  };
}
