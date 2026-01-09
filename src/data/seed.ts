import type { Notebook } from '@/types';

export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: '1',
    title: 'AI Research 2024',
    accent: 'purple',
    sources: [
      {
        id: 's1',
        type: 'text',
        name: 'GPT-4 Overview',
        preview: 'GPT-4 is a multimodal AI model developed by OpenAI that can process both text and images...',
        content: 'GPT-4 is a multimodal AI model developed by OpenAI that can process both text and images. It represents a significant advancement in language model capabilities, demonstrating improved reasoning, creativity, and safety compared to previous versions.',
        createdAt: new Date('2024-01-10'),
      },
      {
        id: 's2',
        type: 'file',
        name: 'research_paper.pdf',
        preview: 'Advanced transformer architectures for language modeling have revolutionized natural language processing...',
        content: 'Advanced transformer architectures for language modeling have revolutionized natural language processing. This paper explores the latest developments in transformer design, including multi-head attention mechanisms, positional encodings, and scaling strategies.',
        createdAt: new Date('2024-01-05'),
      },
    ],
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'React Best Practices',
    accent: 'blue',
    sources: [
      {
        id: 's3',
        type: 'text',
        name: 'Hooks Guide',
        preview: 'React hooks are functions that let you use state and other React features in functional components...',
        content: 'React hooks are functions that let you use state and other React features in functional components without writing a class. The most commonly used hooks are useState for managing state and useEffect for handling side effects. Hooks follow specific rules: they must be called at the top level of your component and cannot be called conditionally.',
        createdAt: new Date('2024-01-12'),
      },
    ],
    updatedAt: new Date('2024-01-14'),
  },
];
