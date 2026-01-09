import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Home } from '@/pages/Home';
import { Notebook } from '@/pages/Notebook';
import { NotebooksProvider } from '@/hooks/NotebooksContext';

function App() {
  return (
    <NotebooksProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/notebook/:id" element={<Notebook />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </NotebooksProvider>
  );
}

export default App;
