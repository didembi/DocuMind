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

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Bu bir demo yanıtıdır. Backend entegrasyonu yapıldığında, gerçek AI yanıtları burada görünecek.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
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
