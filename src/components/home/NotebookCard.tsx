import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Notebook } from '@/types';
import { Badge } from '@/components/ui/badge';
import { NotebookCardMenu } from './NotebookCardMenu';
import { formatDistanceToNow } from '@/lib/date-utils';

interface NotebookCardProps {
  notebook: Notebook;
  onEdit: () => void;
  onDelete: () => void;
}

export function NotebookCard({ notebook, onEdit, onDelete }: NotebookCardProps) {
  const navigate = useNavigate();

  const sourceCount = notebook.sources.length;
  const preview = notebook.sources[0]?.preview.slice(0, 50) || 'Henüz kaynak yok';
  const lastUpdated = formatDistanceToNow(notebook.updatedAt);

  const accentColors = {
    purple: 'from-purple-600 to-purple-400',
    blue: 'from-blue-600 to-blue-400',
    green: 'from-green-600 to-green-400',
    red: 'from-red-600 to-red-400',
    orange: 'from-orange-600 to-orange-400',
  };

  return (
    <div
      onClick={() => navigate(`/notebook/${notebook.id}`)}
      className="group glass-card rounded-lg p-5 cursor-pointer hover-lift transition-smooth relative"
    >
      {/* Accent bar */}
      {notebook.accent && (
        <div
          className={`absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-gradient-to-r ${accentColors[notebook.accent]}`}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold truncate pr-2 flex-1">
          {notebook.title}
        </h3>
        <NotebookCardMenu onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="secondary" className="gap-1">
          <FileText className="h-3 w-3" />
          {sourceCount} kaynak
        </Badge>
        <span className="text-xs text-muted-foreground">
          {lastUpdated}
        </span>
      </div>

      {/* Preview */}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {preview}...
      </p>
    </div>
  );
}
