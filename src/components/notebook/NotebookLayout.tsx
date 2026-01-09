import type { ReactNode } from 'react';

interface NotebookLayoutProps {
  sidebar: ReactNode;
  chat: ReactNode;
}

export function NotebookLayout({ sidebar, chat }: NotebookLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {sidebar}
      {chat}
    </div>
  );
}
