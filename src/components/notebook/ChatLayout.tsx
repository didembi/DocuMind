import type { Message } from '@/types';
import { MessageList } from './MessageList';
import { Composer } from './Composer';

interface ChatLayoutProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
}

export function ChatLayout({ messages, onSendMessage }: ChatLayoutProps) {
  return (
    <div className="flex-1 glass-card rounded-lg flex flex-col h-[calc(100vh-180px)]">
      <MessageList messages={messages} />
      <Composer onSend={onSendMessage} />
    </div>
  );
}
