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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (sources: Array<{ type: 'file' | 'text'; name: string; content: string }>) => void;
}

export function AddSourceDialog({
  open,
  onOpenChange,
  onAdd,
}: AddSourceDialogProps) {
  const [files, setFiles] = useState<Array<{ name: string; file: File }>>([]);
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setTextContent('');
    }
  }, [open]);

  const handleAdd = () => {
    const sources: Array<{ type: 'file' | 'text'; name: string; content: string }> = [];

    files.forEach((file) => {
      sources.push({
        type: 'file',
        name: file.name,
        content: `Content from ${file.name}`,
      });
    });

    if (textContent.trim()) {
      sources.push({
        type: 'text',
        name: 'Metin kaynağı',
        content: textContent.trim(),
      });
    }

    onAdd(sources);
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
          <DialogTitle>Kaynak Ekle</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="file" className="py-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Dosya Yükle</TabsTrigger>
            <TabsTrigger value="text">Metin Yapıştır</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
              <input
                type="file"
                id="source-file-upload"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="source-file-upload"
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
                <Label htmlFor="source-text-content">Metin</Label>
                <Textarea
                  id="source-text-content"
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            variant="gradient"
            onClick={handleAdd}
            disabled={files.length === 0 && !textContent.trim()}
          >
            Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
