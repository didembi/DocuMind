import { useState } from 'react';
import type { Message, MessageSource } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, FileText, MapPin, ExternalLink } from 'lucide-react';
import { api } from '@/services/api';

interface MessageBubbleProps {
  message: Message;
}

interface SourcePreviewModalProps {
  source: MessageSource;
  onClose: () => void;
}

function SourcePreviewModal({ source, onClose }: SourcePreviewModalProps) {
  const [fullText, setFullText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFullText = async () => {
    if (fullText) return;
    setLoading(true);
    try {
      const chunk = await api.getChunk(source.document_id, source.chunk_id);
      setFullText(chunk.chunk.chunk_text);
    } catch (error) {
      console.error('Failed to load chunk:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#1a1d2e] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">{source.title}</h3>
            <p className="text-xs text-muted-foreground">
              {source.page !== null ? `Sayfa ${source.page}` : null}
              {source.line_start !== null ? ` | Satir ${source.line_start}-${source.line_end}` : null}
              {source.page === null && source.line_start === null ? `Bolum ${source.chunk_index}` : null}
              {' | '}Benzerlik: {Math.round(source.similarity * 100)}%
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            X
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-white/90 whitespace-pre-wrap">
            {fullText || source.preview}
          </p>
          {!fullText && (
            <button
              onClick={loadFullText}
              disabled={loading}
              className="mt-4 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              {loading ? 'Yukleniyor...' : (
                <>
                  <ExternalLink className="h-3 w-3" />
                  Tam metni goster
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceItem({ source, onClick }: { source: MessageSource; onClick: () => void }) {
  const locationText = source.page !== null
    ? `Sayfa ${source.page}`
    : source.line_start !== null
      ? `Satir ${source.line_start}-${source.line_end}`
      : `Bolum ${source.chunk_index}`;

  return (
    <button
      onClick={onClick}
      className="flex items-start gap-2 p-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-left w-full"
    >
      <FileText className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{source.title}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {locationText}
          </span>
          <span className="text-purple-400">{Math.round(source.similarity * 100)}%</span>
        </div>
      </div>
    </button>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [selectedSource, setSelectedSource] = useState<MessageSource | null>(null);

  const hasSources = message.sources && message.sources.length > 0;

  return (
    <>
      <div
        className={cn(
          'flex',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        <div
          className={cn(
            'max-w-[80%] rounded-lg animate-fade-in',
            isUser
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3'
              : 'glass-subtle'
          )}
        >
          <div className={cn(!isUser && 'px-4 py-3')}>
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
            <span className="text-xs opacity-70 mt-1 block">
              {message.createdAt.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Sources section for assistant messages */}
          {!isUser && hasSources && (
            <div className="border-t border-white/10 mt-2">
              <button
                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                className="flex items-center justify-between w-full px-4 py-2 text-xs text-muted-foreground hover:text-white transition-colors"
              >
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {message.sources!.length} kaynak
                </span>
                {sourcesExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {sourcesExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {message.sources!.map((source, idx) => (
                    <SourceItem
                      key={`${source.chunk_id}-${idx}`}
                      source={source}
                      onClick={() => setSelectedSource(source)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Source preview modal */}
      {selectedSource && (
        <SourcePreviewModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </>
  );
}
