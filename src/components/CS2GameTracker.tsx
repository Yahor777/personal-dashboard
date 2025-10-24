import { useState } from 'react';
import { X, Plus, Play, Image, Video, Target, TrendingUp, Award, Clock, MapPin, Users, Crosshair, ZapIcon, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';

interface CS2GameTrackerProps {
  onClose: () => void;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title: string;
  description: string;
  map: string;
  category: 'utility' | 'highlight' | 'clutch' | 'ace';
  uploadedAt: string;
  views: number;
  likes: number;
}

interface GameSession {
  id: string;
  date: string;
  map: string;
  result: 'win' | 'loss' | 'tie';
  score: string;
  kills: number;
  deaths: number;
  assists: number;
  mvp: boolean;
  rank: string;
  notes: string;
}

// Mock данные
const MOCK_MEDIA: MediaItem[] = [
  {
    id: '1',
    type: 'video',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    title: 'Smoke Mid на Mirage',
    description: 'Идеальный смок для A-раша. Бросать из CT спавна.',
    map: 'Mirage',
    category: 'utility',
    uploadedAt: '2024-10-10',
    views: 245,
    likes: 42,
  },
  {
    id: '2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    title: 'AWP clutch 1v4',
    description: 'Невероятный клатч на B сайте. Удачные пики.',
    map: 'Dust 2',
    category: 'clutch',
    uploadedAt: '2024-10-12',
    views: 512,
    likes: 89,
  },
  {
    id: '3',
    type: 'video',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400',
    title: 'ACE with M4A1-S на Inferno',
    description: 'Чистый ACE на A сайте. Спрей-контроль на высоте.',
    map: 'Inferno',
    category: 'ace',
    uploadedAt: '2024-10-13',
    views: 891,
    likes: 156,
  },
];

const CS2_MAPS = ['Mirage', 'Dust 2', 'Inferno', 'Nuke', 'Overpass', 'Vertigo', 'Ancient', 'Anubis'];
const MEDIA_CATEGORIES = [
  { id: 'utility', name: '💨 Раскидки', color: 'blue' },
  { id: 'highlight', name: '⭐ Хайлайты', color: 'yellow' },
  { id: 'clutch', name: '🎯 Клатчи', color: 'green' },
  { id: 'ace', name: '🔥 ACE', color: 'red' },
];

export function CS2GameTracker({ onClose }: CS2GameTrackerProps) {
  const [activeTab, setActiveTab] = useState('media');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(MOCK_MEDIA);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [filterMap, setFilterMap] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Stats
  const totalGames = 127;
  const wins = 78;
  const winRate = Math.round((wins / totalGames) * 100);
  const currentRank = 'Legendary Eagle Master';
  const avgKD = 1.34;

  const filteredMedia = mediaItems.filter(item => {
    if (filterMap !== 'all' && item.map !== filterMap) return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    return true;
  });

  return (
    <div data-panel="true" className="fixed inset-0 z-50 flex bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 bg-gradient-to-r from-orange-500/10 to-blue-500/10 pt-safe">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-lg bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center">
                <Crosshair className="size-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">🎮 CS2 Game Tracker</h2>
                <p className="text-sm text-muted-foreground">Раскидки, хайлайты и статистика</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Award className="size-8 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold">{winRate}%</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Target className="size-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{avgKD}</div>
                    <div className="text-xs text-muted-foreground">K/D Ratio</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="size-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{totalGames}</div>
                    <div className="text-xs text-muted-foreground">Игр сыграно</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <ZapIcon className="size-8 text-orange-500" />
                  <div>
                    <div className="text-lg font-bold">{currentRank}</div>
                    <div className="text-xs text-muted-foreground">Текущий ранг</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-border px-4">
            <TabsList>
              <TabsTrigger value="media">📹 Медиа ({mediaItems.length})</TabsTrigger>
              <TabsTrigger value="games">📊 История игр</TabsTrigger>
              <TabsTrigger value="maps">🗺️ Карты</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="media" className="h-full m-0">
              <div className="h-full flex flex-col">
                {/* Filters & Upload */}
                <div className="border-b border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Select value={filterMap} onValueChange={setFilterMap}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Карта" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все карты</SelectItem>
                        {CS2_MAPS.map(map => (
                          <SelectItem key={map} value={map}>{map}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Категория" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все категории</SelectItem>
                        {MEDIA_CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Plus className="size-4 mr-2" />
                    Загрузить
                  </Button>
                </div>

                {/* Media Grid */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full pb-safe">
                    <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredMedia.map((item) => (
                        <Card
                          key={item.id}
                          className="hover:border-primary cursor-pointer transition-all group"
                          onClick={() => setSelectedMedia(item)}
                        >
                          <CardHeader className="p-0">
                            <div className="relative">
                              <img
                                src={item.thumbnail || item.url}
                                alt={item.title}
                                className="w-full h-48 object-cover rounded-t-lg"
                              />
                              {item.type === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-all">
                                  <Play className="size-12 text-white" />
                                </div>
                              )}
                              <Badge className="absolute top-2 left-2 bg-background/90">
                                {item.type === 'video' ? <Video className="size-3 mr-1" /> : <Image className="size-3 mr-1" />}
                                {item.type === 'video' ? 'Видео' : 'Фото'}
                              </Badge>
                              <Badge className="absolute top-2 right-2 bg-blue-500">
                                <MapPin className="size-3 mr-1" />
                                {item.map}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                {MEDIA_CATEGORIES.find(c => c.id === item.category)?.name}
                              </Badge>
                            </div>
                            <CardTitle className="text-sm line-clamp-1 mb-2">{item.title}</CardTitle>
                            <CardDescription className="text-xs line-clamp-2 mb-3">
                              {item.description}
                            </CardDescription>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{item.views} просмотров</span>
                              <span>❤️ {item.likes}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="games" className="h-full m-0">
               <ScrollArea className="h-full pb-safe">
                <div className="p-4">
                  <p className="text-muted-foreground text-center py-8">История игр скоро будет добавлена...</p>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="maps" className="h-full m-0">
               <ScrollArea className="h-full pb-safe">
                <div className="p-4">
                  <p className="text-muted-foreground text-center py-8">Статистика по картам скоро будет добавлена...</p>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Media Player Modal */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedMedia.title}</DialogTitle>
              <DialogDescription>{selectedMedia.description}</DialogDescription>
            </DialogHeader>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {selectedMedia.type === 'video' ? (
                <iframe
                  src={selectedMedia.url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img src={selectedMedia.url} alt={selectedMedia.title} className="w-full h-full object-contain" />
              )}
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <Badge><MapPin className="size-3 mr-1" />{selectedMedia.map}</Badge>
                <Badge variant="outline">{MEDIA_CATEGORIES.find(c => c.id === selectedMedia.category)?.name}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>👁️ {selectedMedia.views}</span>
                <span>❤️ {selectedMedia.likes}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить медиа</DialogTitle>
            <DialogDescription>Добавьте скрин или видео с раскидкой/хайлайтом</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Тип</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">📷 Изображение</SelectItem>
                  <SelectItem value="video">🎥 Видео</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Заголовок</label>
              <Input placeholder="Smoke Mid на Mirage" />
            </div>
            <div>
              <label className="text-sm font-medium">Описание</label>
              <Textarea placeholder="Описание раскидки или момента..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Карта</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CS2_MAPS.map(map => (
                      <SelectItem key={map} value={map}>{map}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Категория</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">URL</label>
              <Input placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={() => {
              toast.success('Медиа загружено!');
              setIsUploadDialogOpen(false);
            }}>
              <Upload className="size-4 mr-2" />
              Загрузить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
