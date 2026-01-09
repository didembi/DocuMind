export type NotebookAccent = 'purple' | 'blue' | 'green' | 'red' | 'orange';

export type Source = {
  id: string;
  type: 'file' | 'text';
  name: string;
  preview: string;      // first 200 chars
  content: string;      // full content
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
  createdAt: Date;
};
