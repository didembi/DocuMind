import { useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/Topbar';
import { NotebookGrid } from '@/components/home/NotebookGrid';
import { EmptyState } from '@/components/common/EmptyState';
import { CreateNotebookDialog } from '@/components/home/CreateNotebookDialog';
import { EditTitleDialog } from '@/components/home/EditTitleDialog';
import { DeleteConfirmDialog } from '@/components/home/DeleteConfirmDialog';
import { useNotebooksContext } from '@/hooks/NotebooksContext';

export function Home() {
  const navigate = useNavigate();
  const {
    notebooks,
    isLoading,
    createNotebook,
    deleteNotebook,
    updateNotebookTitle,
  } = useNotebooksContext();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);

  const selectedNotebook = notebooks.find((n) => n.id === selectedNotebookId);

  const handleCreateNotebook = (
    title: string,
    accent: any,
    sources: Array<{ type: 'file' | 'text'; name: string; content: string; documentId?: string }>
  ) => {
    const id = createNotebook(title, accent, sources);
    toast.success('Not defteri oluşturuldu');
    navigate(`/notebook/${id}`);
  };

  const handleEditNotebook = (id: string) => {
    setSelectedNotebookId(id);
    setEditDialogOpen(true);
  };

  const handleDeleteNotebook = (id: string) => {
    setSelectedNotebookId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedNotebookId) {
      deleteNotebook(selectedNotebookId);
      toast.success('Not defteri silindi');
    }
  };

  const handleSaveTitle = (newTitle: string) => {
    if (selectedNotebookId) {
      updateNotebookTitle(selectedNotebookId, newTitle);
      toast.success('Not defteri güncellendi');
    }
  };

  return (
    <>
      <Topbar onCreateNotebook={() => setCreateDialogOpen(true)} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belgeler yükleniyor...</p>
          </div>
        ) : notebooks.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Henüz not defterin yok"
            description="Yeni bir not defteri oluşturarak belgelerinizi organize etmeye başlayın."
            actionLabel="Yeni oluştur"
            onAction={() => setCreateDialogOpen(true)}
          />
        ) : (
          <NotebookGrid
            notebooks={notebooks}
            onEditNotebook={handleEditNotebook}
            onDeleteNotebook={handleDeleteNotebook}
          />
        )}
      </main>

      <CreateNotebookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateNotebook}
      />

      {selectedNotebook && (
        <>
          <EditTitleDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            currentTitle={selectedNotebook.title}
            onSave={handleSaveTitle}
          />

          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title={selectedNotebook.title}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
    </>
  );
}
