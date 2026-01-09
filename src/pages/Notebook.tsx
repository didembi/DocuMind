import { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/Topbar';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { NotebookLayout } from '@/components/notebook/NotebookLayout';
import { SourceSidebar } from '@/components/notebook/SourceSidebar';
import { ChatLayout } from '@/components/notebook/ChatLayout';
import { AddSourceDialog } from '@/components/notebook/AddSourceDialog';
import { CreateNotebookDialog } from '@/components/home/CreateNotebookDialog';
import { useNotebooksContext } from '@/hooks/NotebooksContext';
import type { Message } from '@/types';
import { api } from '@/services/api';

export function Notebook() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getNotebook, addSource, removeSource, createNotebook } = useNotebooksContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [addSourceDialogOpen, setAddSourceDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const notebook = id ? getNotebook(id) : null;

  if (!notebook) {
    return <Navigate to="/" replace />;
  }

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // DEBUG: Log notebook sources
      console.log('🔍 Notebook sources:', notebook.sources);

      // Get document IDs from sources
      const documentIds = notebook.sources
        .filter((s) => s.documentId) // Only include sources with backend IDs
        .map((s) => s.documentId!);

      console.log('🔍 Document IDs found:', documentIds);

      if (documentIds.length === 0) {
        throw new Error('Bu not defterinde yüklenmiş belge yok');
      }

      // Query backend AI
      const response = await api.queryDocuments(content, documentIds);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(`Bir hata oluştu: ${error}`);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Üzgünüm, cevap oluştururken bir hata oluştu. Lütfen tekrar deneyin.',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleAddSource = (sources: Array<{ type: 'file' | 'text'; name: string; content: string }>) => {
    if (id) {
      addSource(id, sources);
      toast.success('Kaynak eklendi');
    }
  };

  const handleRemoveSource = (sourceId: string) => {
    if (id) {
      removeSource(id, sourceId);
      toast.success('Kaynak silindi');
    }
  };

  const handleCreateNotebook = (
    title: string,
    accent: any,
    sources: Array<{ type: 'file' | 'text'; name: string; content: string }>
  ) => {
    const newId = createNotebook(title, accent, sources);
    navigate(`/notebook/${newId}`);
  };

  return (
    <>
      <Topbar onCreateNotebook={() => setCreateDialogOpen(true)} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb title={notebook.title} />

        <NotebookLayout
          sidebar={
            <SourceSidebar
              sources={notebook.sources}
              onAddSource={() => setAddSourceDialogOpen(true)}
              onRemoveSource={handleRemoveSource}
            />
          }
          chat={
            <ChatLayout
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          }
        />
      </main>

      <AddSourceDialog
        open={addSourceDialogOpen}
        onOpenChange={setAddSourceDialogOpen}
        onAdd={handleAddSource}
      />

      <CreateNotebookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateNotebook}
      />
    </>
  );
}
