import { Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopbarProps {
  onCreateNotebook: () => void;
}

export function Topbar({ onCreateNotebook }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold gradient-text">
              DocuMind
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="gradient"
              size="default"
              onClick={onCreateNotebook}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni oluştur
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
