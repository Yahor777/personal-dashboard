import { useState, useRef } from 'react';
import { X, Upload, ZoomIn, ZoomOut, Download, Trash2, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import type { CardImage } from '../types';

interface ImageGalleryProps {
  images: CardImage[];
  onAddImage: (image: Omit<CardImage, 'id' | 'uploadedAt'>) => void;
  onRemoveImage: (imageId: string) => void;
  onUpdateImage: (imageId: string, updates: Partial<CardImage>) => void;
}

export function ImageGallery({ images, onAddImage, onRemoveImage, onUpdateImage }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<CardImage | null>(null);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          onAddImage({
            url: file.name,
            dataUrl,
            caption: '',
            tags: [],
          });
        };
        reader.readAsDataURL(file);
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            onAddImage({
              url: file.name,
              dataUrl,
              caption: '',
              tags: [],
            });
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleDownload = (image: CardImage) => {
    if (image.dataUrl) {
      const link = document.createElement('a');
      link.href = image.dataUrl;
      link.download = image.url || 'image.png';
      link.click();
    }
  };

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      {/* Upload Area */}
      <div>
        <Label>Фотографии</Label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary hover:bg-muted/50"
        >
          <Upload className="mb-2 size-8 text-muted-foreground" />
          <p className="mb-1">
            Нажмите для загрузки или вставьте (Ctrl+V)
          </p>
          <p className="text-muted-foreground">
            JPG, PNG, GIF до 5MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              <img
                src={image.dataUrl || image.url}
                alt={image.caption || 'Image'}
                className="size-full cursor-pointer object-cover transition-transform hover:scale-110"
                onClick={() => setSelectedImage(image)}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedImage(image)}
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(image.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {image.tags.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                  <div className="flex flex-wrap gap-1">
                    {image.tags.slice(0, 2).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {image.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{image.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Viewer Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Просмотр изображения</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                  <span className="text-muted-foreground">{Math.round(zoom * 100)}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(selectedImage)}
                  >
                    <Download className="size-4" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="overflow-auto">
              <img
                src={selectedImage.dataUrl || selectedImage.url}
                alt={selectedImage.caption || 'Image'}
                className="mx-auto"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="caption">Подпись</Label>
                <Input
                  id="caption"
                  value={selectedImage.caption || ''}
                  onChange={(e) =>
                    onUpdateImage(selectedImage.id, { caption: e.target.value })
                  }
                  placeholder="Добавить подпись..."
                />
              </div>

              <div>
                <Label htmlFor="tags">Теги (через запятую)</Label>
                <Input
                  id="tags"
                  value={selectedImage.tags.join(', ')}
                  onChange={(e) =>
                    onUpdateImage(selectedImage.id, {
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="GPU, RX 580, тест..."
                />
              </div>

              {selectedImage.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedImage.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      <Tag className="mr-1 size-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <p className="text-muted-foreground">
        💡 Совет: Используйте теги для быстрого поиска фото (например: "GPU", "серийник", "тест")
      </p>
    </div>
  );
}
