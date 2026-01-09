export type NotebookAccent = 'purple' | 'blue' | 'green' | 'red' | 'orange';

export type Source = {
  id: string;
  type: 'file' | 'text';
  name: string;
  preview: string;      // first 200 chars
  content: string;      // full content
  documentId?: string;  // Backend document ID (for API calls)
  createdAt: Date;
};

export type Notebook = {
  id: string;
  title: string;
  accent?: NotebookAccent;
  sources: Source[];
  updatedAt: Date;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    document_id: string;
    page_number: number;
    similarity: number;
  }>;
  createdAt: Date;
};
