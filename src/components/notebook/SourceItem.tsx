import { FileText, X } from 'lucide-react';
import type { Source } from '@/types';
import { Button } from '@/components/ui/button';

interface SourceItemProps {
  source: Source;
  onRemove: () => void;
}

export function SourceItem({ source, onRemove }: SourceItemProps) {
  const Icon = source.type === 'file' ? FileText : FileText;

  return (
    <div className="group flex items-center justify-between glass-subtle p-2 rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon className="h-4 w-4 text-purple-400 flex-shrink-0" />
        <span className="text-sm truncate">{source.name}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
