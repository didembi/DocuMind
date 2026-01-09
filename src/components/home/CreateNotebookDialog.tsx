import { useState, useEffect } from 'react';
import { Cloud, FileText, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { NotebookAccent } from '@/types';
import { cn } from '@/lib/utils';

interface CreateNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string, accent: NotebookAccent | undefined, sources: Array<{ type: 'file' | 'text'; name: string; content: string }>) => void;
}

export function CreateNotebookDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateNotebookDialogProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState<NotebookAccent | undefined>('purple');
  const [files, setFiles] = useState<Array<{ name: string; file: File }>>([]);
  const [textContent, setTextContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const accents: { value: NotebookAccent; label: string; class: string }[] = [
    { value: 'purple', label: 'Mor', class: 'bg-purple-600' },
    { value: 'blue', label: 'Mavi', class: 'bg-blue-600' },
    { value: 'green', label: 'Yeşil', class: 'bg-green-600' },
    { value: 'red', label: 'Kırmızı', class: 'bg-red-600' },
    { value: 'orange', label: 'Turuncu', class: 'bg-orange-600' },
  ];

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setStep(1);
      setTitle('');
      setAccent('purple');
      setFiles([]);
      setTextContent('');
      setIsCreating(false);
    }
  }, [open]);

  const handleContinue = () => {
    if (title.trim()) {
      setStep(2);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);

    // Simulate creation delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const sources: Array<{ type: 'file' | 'text'; name: string; content: string }> = [];

    // Add file sources
    files.forEach((file) => {
      sources.push({
        type: 'file',
        name: file.name,
        content: `Content from ${file.name}`, // Mock content
      });
    });

    // Add text source
    if (textContent.trim()) {
      sources.push({
        type: 'text',
        name: 'Metin kaynağı',
        content: textContent.trim(),
      });
    }

    onCreate(title.trim(), accent, sources);
    setIsCreating(false);
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = selectedFiles.map((file) => ({ name: file.name, file }));
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Yeni Not Defteri' : 'Kaynak Ekle'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="notebook-title">Not defteri adı *</Label>
              <Input
                id="notebook-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleContinue();
                  }
                }}
                placeholder="Örn: AI Research 2024"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Renk seç (isteğe bağlı)</Label>
              <div className="flex gap-3">
                {accents.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setAccent(item.value)}
                    className={cn(
                      'h-10 w-10 rounded-full transition-all',
                      item.class,
                      accent === item.value
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-white scale-110'
                        : 'opacity-60 hover:opacity-100'
                    )}
                    title={item.label}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <Tabs defaultValue="file" className="py-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Dosya Yükle</TabsTrigger>
              <TabsTrigger value="text">Metin Yapıştır</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Cloud className="h-12 w-12 text-muted-foreground" />
                  <p className="font-medium">Dosyayı buraya sürükle</p>
                  <p className="text-sm text-muted-foreground">
                    PDF, DOCX, TXT (maks 50MB)
                  </p>
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between glass-subtle p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="text-content">Metin</Label>
                  <Textarea
                    id="text-content"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Metin yapıştırın..."
                    className="min-h-[200px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Önizleme</Label>
                  <div className="glass-card p-4 rounded-lg min-h-[200px] text-sm text-muted-foreground">
                    {textContent ? (
                      <p className="line-clamp-[10]">{textContent}</p>
                    ) : (
                      <p className="italic">Önizleme burada görünecek...</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>
              Geri
            </Button>
          )}
          {step === 1 ? (
            <Button
              variant="gradient"
              onClick={handleContinue}
              disabled={!title.trim()}
            >
              Devam et
            </Button>
          ) : (
            <Button
              variant="gradient"
              onClick={handleCreate}
              disabled={isCreating || (files.length === 0 && !textContent.trim())}
            >
              {isCreating ? 'Oluşturuluyor...' : 'Not defterini oluştur'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
