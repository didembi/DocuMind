import type { Notebook } from '@/types';
import { NotebookCard } from './NotebookCard';

interface NotebookGridProps {
  notebooks: Notebook[];
  onEditNotebook: (id: string) => void;
  onDeleteNotebook: (id: string) => void;
}

export function NotebookGrid({
  notebooks,
  onEditNotebook,
  onDeleteNotebook,
}: NotebookGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notebooks.map((notebook) => (
        <NotebookCard
          key={notebook.id}
          notebook={notebook}
          onEdit={() => onEditNotebook(notebook.id)}
          onDelete={() => onDeleteNotebook(notebook.id)}
        />
      ))}
    </div>
  );
}
