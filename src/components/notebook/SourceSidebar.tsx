import { Plus, FileText } from 'lucide-react';
import type { Source } from '@/types';
import { Button } from '@/components/ui/button';
import { SourceItem } from './SourceItem';

interface SourceSidebarProps {
  sources: Source[];
  onAddSource: () => void;
  onRemoveSource: (sourceId: string) => void;
}

export function SourceSidebar({
  sources,
  onAddSource,
  onRemoveSource,
}: SourceSidebarProps) {
  return (
    <div className="w-full lg:w-64 flex-shrink-0 glass-card rounded-lg p-4 space-y-4 h-fit max-h-[calc(100vh-180px)] flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Kaynaklar</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddSource}
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {sources.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Henüz kaynak eklemediniz. "+" butonuna tıklayın.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
          {sources.map((source) => (
            <SourceItem
              key={source.id}
              source={source}
              onRemove={() => onRemoveSource(source.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
