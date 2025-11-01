import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent } from "../ui/dialog";
import { Search, Grid3x3, Download, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import Masonry from "react-responsive-masonry";

const images = [
  { id: 1, title: "Mountain Landscape", category: "Nature", tags: ["природа", "горы"], height: 300 },
  { id: 2, title: "City Skyline", category: "Urban", tags: ["город", "архитектура"], height: 250 },
  { id: 3, title: "Abstract Art", category: "Art", tags: ["искусство", "абстракция"], height: 400 },
  { id: 4, title: "Coffee Cup", category: "Food", tags: ["еда", "кофе"], height: 280 },
  { id: 5, title: "Workspace Setup", category: "Tech", tags: ["технологии", "работа"], height: 320 },
  { id: 6, title: "Sunset Beach", category: "Nature", tags: ["природа", "закат"], height: 270 },
  { id: 7, title: "Modern Interior", category: "Design", tags: ["дизайн", "интерьер"], height: 350 },
  { id: 8, title: "Street Photography", category: "Urban", tags: ["город", "фото"], height: 290 },
  { id: 9, title: "Ocean Waves", category: "Nature", tags: ["природа", "океан"], height: 310 },
];

const categories = ["Все", "Nature", "Urban", "Art", "Food", "Tech", "Design"];

export function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredImages = images.filter((img) => {
    const matchesCategory = selectedCategory === "Все" || img.category === selectedCategory;
    const matchesSearch =
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleImageSelection = (id: number) => {
    setSelectedImages((prev) =>
      prev.includes(id) ? prev.filter((imgId) => imgId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Галерея</h1>
          <p className="text-muted-foreground">Управление изображениями и медиа</p>
        </div>
        <Button>Загрузить</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию или тегам..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Selection Actions */}
      {selectedImages.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <span>Выбрано: {selectedImages.length}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Экспорт
              </Button>
              <Button size="sm" variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedImages([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gallery Grid */}
      <Masonry columnsCount={3} gutter="1rem">
        {filteredImages.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-lg"
          >
            <div
              className="cursor-pointer bg-muted transition-transform hover:scale-105"
              style={{ height: image.height }}
              onClick={() => setLightboxImage(image.id)}
            >
              <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
                <div>
                  <Grid3x3 className="mx-auto mb-2 h-8 w-8" />
                  <p>{image.title}</p>
                </div>
              </div>
            </div>
            <div className="absolute left-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <div
                className="rounded bg-background/80 p-1 backdrop-blur"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleImageSelection(image.id);
                }}
              >
                <Checkbox
                  checked={selectedImages.includes(image.id)}
                  onCheckedChange={() => toggleImageSelection(image.id)}
                />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Badge variant="secondary">{image.category}</Badge>
              {image.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </motion.div>
        ))}
      </Masonry>

      {/* Lightbox */}
      <Dialog open={lightboxImage !== null} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl">
          {lightboxImage && (
            <div className="space-y-4">
              <div className="flex aspect-video items-center justify-center bg-muted">
                <div className="text-center">
                  <Grid3x3 className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {images.find((img) => img.id === lightboxImage)?.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {images
                    .find((img) => img.id === lightboxImage)
                    ?.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
