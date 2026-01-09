import { useState, useEffect } from 'react';
import { Cloud, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { api } from '@/services/api';

interface CreateNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string, accent: NotebookAccent | undefined, sources: Array<{ type: 'file' | 'text'; name: string; content: string; documentId?: string }>) => void;
}

export function CreateNotebookDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateNotebookDialogProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState<NotebookAccent | undefined>('purple');
  const [files, setFiles] = useState<Array<{ name: string; file: File; documentId?: string; uploading?: boolean }>>([]);
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

    try {
      console.log('📝 Creating notebook with files:', files);

      const sources: Array<{ type: 'file' | 'text'; name: string; content: string; documentId?: string }> = [];

      // Add file sources with documentId
      files.forEach((file) => {
        console.log('📄 Processing file:', file);
        if (file.documentId) {
          sources.push({
            type: 'file',
            name: file.name,
            content: `Document ID: ${file.documentId}`,
            documentId: file.documentId,
          });
          console.log('✅ Added to sources with documentId:', file.documentId);
        } else {
          console.warn('⚠️ File has no documentId:', file.name);
        }
      });

      // Add text source (metin kaynağı backend'e upload edilmeyecek, sadece frontend'te kalacak)
      if (textContent.trim()) {
        sources.push({
          type: 'text',
          name: 'Metin kaynağı',
          content: textContent.trim(),
        });
      }

      console.log('📦 Final sources array:', sources);
      onCreate(title.trim(), accent, sources);
      onOpenChange(false);
    } catch (error) {
      toast.error('Not defteri oluşturulamadı');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Add files to state immediately with uploading flag
    const newFiles = selectedFiles.map((file) => ({
      name: file.name,
      file,
      uploading: true,
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    // Upload each file to backend
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        console.log('📤 Uploading file:', file.name);
        const response = await api.uploadDocument(file);
        console.log('✅ Upload response:', response);

        // Update file with documentId
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.uploading
              ? { ...f, documentId: response.id, uploading: false }
              : f
          )
        );

        console.log('✅ Updated files state with documentId:', response.id);
        toast.success(`${file.name} yüklendi (${response.chunks_count} chunk)`);
      } catch (error) {
        console.error('❌ Upload error:', error);
        toast.error(`${file.name} yüklenemedi: ${error}`);
        // Remove failed file
        setFiles((prev) => prev.filter((f) => !(f.name === file.name && f.uploading)));
      }
    }
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
                        {file.uploading ? (
                          <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                        ) : file.documentId ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : (
                          <FileText className="h-4 w-4 text-purple-400" />
                        )}
                        <span className="text-sm">{file.name}</span>
                        {file.uploading && (
                          <span className="text-xs text-muted-foreground">Yükleniyor...</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6"
                        disabled={file.uploading}
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
              disabled={
                isCreating ||
                (files.length === 0 && !textContent.trim()) ||
                files.some((f) => f.uploading) // Disable if any file is still uploading
              }
            >
              {files.some((f) => f.uploading)
                ? 'Yükleniyor...'
                : isCreating
                ? 'Oluşturuluyor...'
                : 'Not defterini oluştur'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
