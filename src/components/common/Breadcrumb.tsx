import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BreadcrumbProps {
  title: string;
}

export function Breadcrumb({ title }: BreadcrumbProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 mb-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => navigate('/')}
          className="hover:text-foreground transition-colors"
        >
          Ana Sayfa
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{title}</span>
      </div>
    </div>
  );
}
