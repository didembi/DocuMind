import { useState, useEffect, useCallback } from 'react';
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
import type { Message, MessageSource } from '@/types';
import { api } from '@/services/api';

// LocalStorage'dan mesajlari yukle
function loadMessages(notebookId: string): Message[] {
  try {
    const stored = localStorage.getItem(`documind_messages_${notebookId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      }));
    }
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
  return [];
}

// LocalStorage'a mesajlari kaydet
function saveMessages(notebookId: string, messages: Message[]) {
  try {
    localStorage.setItem(`documind_messages_${notebookId}`, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
}

export function Notebook() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getNotebook, addSource, removeSource, createNotebook } = useNotebooksContext();

  // Mesajlari localStorage'dan yukle
  const [messages, setMessages] = useState<Message[]>(() => (id ? loadMessages(id) : []));
  const [addSourceDialogOpen, setAddSourceDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [documentsReady, setDocumentsReady] = useState(true);

  const notebook = id ? getNotebook(id) : null;

  // Check document status on mount and when sources change
  const checkDocumentStatus = useCallback(async () => {
    if (!notebook) return;

    const documentIds = notebook.sources
      .filter((s) => s.documentId)
      .map((s) => s.documentId!);

    if (documentIds.length === 0) {
      setDocumentsReady(true);
      return;
    }

    try {
      const statusChecks = await Promise.all(
        documentIds.map((docId) => api.getDocumentStatus(docId).catch(() => null))
      );

      const allReady = statusChecks.every((s) => s?.status === "ready");
      setDocumentsReady(allReady);

      // If not ready, poll again in 2 seconds
      if (!allReady) {
        setTimeout(checkDocumentStatus, 4000);
      }
    } catch (error) {
      console.error('Failed to check document status:', error);
    }
  }, [notebook]);

  useEffect(() => {
    checkDocumentStatus();
  }, [checkDocumentStatus]);

  // Mesajlar degistiginde localStorage'a kaydet
  useEffect(() => {
    if (id && messages.length > 0) {
      saveMessages(id, messages);
    }
  }, [id, messages]);

  if (!notebook) {
    return <Navigate to="/" replace />;
  }

  const hasDocuments = notebook.sources.some((s) => s.documentId);

  const getDocumentIds = () => {
    return notebook.sources
      .filter((s) => s.documentId)
      .map((s) => s.documentId!);
  };

  const handleSendMessage = async (content: string) => {
    if (!documentsReady) {
      toast.info("Belgeler hazırlanıyor (processing). Hazır olunca tekrar deneyin.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const documentIds = getDocumentIds();

      if (documentIds.length === 0) {
        throw new Error('Bu not defterinde yuklenimis belge yok');
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
      toast.error(`Bir hata olustu: ${error}`);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Üzgünüm, cevap oluştururken bir hata oluştu. Lütfen tekrar deneyin.',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShortSummary = async () => {
    const documentIds = getDocumentIds();
    if (documentIds.length === 0) {
      toast.error('Ozet olusturmak icin belge yukleyin');
      return;
    }

    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Kisa ozet olustur',
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Generate summary for first document (can be extended for multiple)
      const response = await api.generateSummary(documentIds[0], 'short', true);

      const sources: MessageSource[] = response.sources.map((s) => ({
        document_id: s.document_id,
        title: notebook.sources.find((src) => src.documentId === s.document_id)?.name || 'Belge',
        chunk_id: s.chunk_id,
        chunk_index: s.chunk_index,
        page: s.page,
        line_start: s.line_start,
        line_end: s.line_end,
        similarity: 1.0,
        preview: '',
      }));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.summary,
        sources: sources.length > 0 ? sources : undefined,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.cached) {
        toast.info('Onbellekteki ozet kullanildi');
      }
    } catch (error) {
      toast.error(`Ozet olusturulamadi: ${error}`);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Uzgunum, ozet olustururken bir hata olustu.',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLongSummary = async () => {
    const documentIds = getDocumentIds();
    if (documentIds.length === 0) {
      toast.error('Ozet olusturmak icin belge yukleyin');
      return;
    }

    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Detayli ozet olustur',
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await api.generateSummary(documentIds[0], 'long', true);

      const sources: MessageSource[] = response.sources.map((s) => ({
        document_id: s.document_id,
        title: notebook.sources.find((src) => src.documentId === s.document_id)?.name || 'Belge',
        chunk_id: s.chunk_id,
        chunk_index: s.chunk_index,
        page: s.page,
        line_start: s.line_start,
        line_end: s.line_end,
        similarity: 1.0,
        preview: '',
      }));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.summary,
        sources: sources.length > 0 ? sources : undefined,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.cached) {
        toast.info('Onbellekteki ozet kullanildi');
      }
    } catch (error) {
      toast.error(`Ozet olusturulamadi: ${error}`);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Uzgunum, detayli ozet olustururken bir hata olustu.',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeywordSearch = async (query: string) => {
    const documentIds = getDocumentIds();
    if (documentIds.length === 0) {
      toast.error('Arama yapmak icin belge yukleyin');
      return;
    }

    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Anahtar kelime aramasi: "${query}"`,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Search in first document (can be extended for multiple)
      const response = await api.keywordSearch(documentIds[0], query);

      let resultContent = '';
      if (response.total === 0) {
        resultContent = `"${query}" icin sonuc bulunamadi.`;
      } else {
        resultContent = `"${query}" icin ${response.total} sonuc bulundu:\n\n`;
        response.results.slice(0, 5).forEach((r, i) => {
          const location = r.page !== null
            ? `Sayfa ${r.page}`
            : r.line_start !== null
              ? `Satir ${r.line_start}-${r.line_end}`
              : `Bolum ${r.chunk_index}`;
          resultContent += `${i + 1}. [${location}]\n${r.preview}\n\n`;
        });
      }

      const sources: MessageSource[] = response.results.map((r) => ({
        document_id: r.document_id,
        title: r.title,
        chunk_id: r.chunk_id,
        chunk_index: r.chunk_index,
        page: r.page,
        line_start: r.line_start,
        line_end: r.line_end,
        similarity: 1.0,
        preview: r.preview,
      }));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: resultContent,
        sources: sources.length > 0 ? sources : undefined,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(`Arama basarisiz: ${error}`);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Uzgunum, arama sirasinda bir hata olustu.',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSource = (sources: Array<{ type: 'file' | 'text'; name: string; content: string; documentId?: string }>) => {
    if (id) {
      addSource(id, sources);
      toast.success('Kaynak eklendi');
      // Re-check document status after adding
      setTimeout(checkDocumentStatus, 4000);
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
              onShortSummary={handleShortSummary}
              onLongSummary={handleLongSummary}
              onKeywordSearch={handleKeywordSearch}
              isLoading={isLoading}
              hasDocuments={hasDocuments}
              documentsReady={documentsReady}
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
