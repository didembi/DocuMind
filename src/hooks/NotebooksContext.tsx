import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useNotebooks } from './useNotebooks';

type NotebooksContextType = ReturnType<typeof useNotebooks>;

const NotebooksContext = createContext<NotebooksContextType | null>(null);

export function NotebooksProvider({ children }: { children: ReactNode }) {
  const notebooks = useNotebooks();

  return (
    <NotebooksContext.Provider value={notebooks}>
      {children}
    </NotebooksContext.Provider>
  );
}

export function useNotebooksContext() {
  const context = useContext(NotebooksContext);
  if (!context) {
    throw new Error('useNotebooksContext must be used within NotebooksProvider');
  }
  return context;
}
