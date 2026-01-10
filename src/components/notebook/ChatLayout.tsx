import type { Message } from '@/types';
import { MessageList } from './MessageList';
import { Composer } from './Composer';

interface ChatLayoutProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onShortSummary?: () => void;
  onLongSummary?: () => void;
  onKeywordSearch?: (query: string) => void;
  isLoading?: boolean;
  hasDocuments?: boolean;
  documentsReady?: boolean;
}

export function ChatLayout({
  messages,
  onSendMessage,
  onShortSummary,
  onLongSummary,
  onKeywordSearch,
  isLoading,
  hasDocuments,
  documentsReady,
}: ChatLayoutProps) {
  return (
    <div className="flex-1 glass-card rounded-lg flex flex-col h-[calc(100vh-180px)]">
      <MessageList messages={messages} />
      <Composer
        onSend={onSendMessage}
        onShortSummary={onShortSummary}
        onLongSummary={onLongSummary}
        onKeywordSearch={onKeywordSearch}
        isLoading={isLoading}
        hasDocuments={hasDocuments}
        documentsReady={documentsReady}
      />
    </div>
  );
}
