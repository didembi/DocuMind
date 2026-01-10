import { useState } from 'react';
import { Send, FileText, BookOpen, Loader2, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type SearchMode = 'semantic' | 'keyword';

interface ComposerProps {
  onSend: (message: string) => void;
  onShortSummary?: () => void;
  onLongSummary?: () => void;
  onKeywordSearch?: (query: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  hasDocuments?: boolean;
  documentsReady?: boolean;
}

export function Composer({
  onSend,
  onShortSummary,
  onLongSummary,
  onKeywordSearch,
  disabled,
  isLoading,
  hasDocuments = true,
  documentsReady = true,
}: ComposerProps) {
  const [message, setMessage] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('semantic');

  const handleSend = () => {
    if (message.trim() && !disabled && !isLoading) {
      if (searchMode === 'keyword' && onKeywordSearch) {
        onKeywordSearch(message.trim());
      } else {
        onSend(message.trim());
      }
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || isLoading || !hasDocuments || !documentsReady;

  return (
    <div className="border-t border-white/10 p-4 glass-subtle">
      {/* Summary buttons and search toggle */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Summary buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={onShortSummary}
            disabled={isDisabled || !onShortSummary}
            className="text-xs h-8 gap-1"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <FileText className="h-3 w-3" />
            )}
            Kisa Ozet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onLongSummary}
            disabled={isDisabled || !onLongSummary}
            className="text-xs h-8 gap-1"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <BookOpen className="h-3 w-3" />
            )}
            Detayli Ozet
          </Button>
        </div>

        {/* Search mode toggle */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setSearchMode('semantic')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              searchMode === 'semantic'
                ? 'bg-purple-600 text-white'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            Anlamsal
          </button>
          <button
            onClick={() => setSearchMode('keyword')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              searchMode === 'keyword'
                ? 'bg-purple-600 text-white'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Search className="h-3 w-3" />
            Anahtar Kelime
          </button>
        </div>
      </div>

      {/* Status messages */}
      {!hasDocuments && (
        <p className="text-xs text-amber-400 mb-2">
          Bu not defterinde yuklenimis belge yok. Lutfen once belge yukleyin.
        </p>
      )}
      {hasDocuments && !documentsReady && (
        <p className="text-xs text-amber-400 mb-2 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Belgeler hazirlaniyor... Lutfen bekleyin.
        </p>
      )}

      {/* Input area */}
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            searchMode === 'keyword'
              ? 'Anahtar kelime yazin...'
              : 'Sorunuzu sorun...'
          }
          className="min-h-[60px] max-h-[120px] resize-none"
          disabled={isDisabled}
        />
        <Button
          variant="gradient"
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || isDisabled}
          className="h-[60px] w-[60px] flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Enter ile gonderin, Shift+Enter ile yeni satir
      </p>
    </div>
  );
}
