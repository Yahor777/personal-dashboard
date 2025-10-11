import { useState } from 'react';
import { X, Search, ExternalLink, Plus, TrendingUp, Package, Sparkles, Wrench, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../data/translations';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AIService, analyzeOLXListing } from '../services/aiService';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ComponentCondition } from '../types';

interface OLXSearchPanelProps {
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  location: string;
  url: string;
  image?: string;
  description: string;
}

const PC_COMPONENTS = [
  { value: 'gpu', label: '🎮 GPU / Видеокарта', keywords: 'видеокарта gpu graphics card rtx gtx rx' },
  { value: 'cpu', label: '⚡ CPU / Процессор', keywords: 'процессор cpu intel amd ryzen' },
  { value: 'ram', label: '💾 RAM / Оперативная память', keywords: 'оперативная память ram ddr' },
  { value: 'motherboard', label: '🔌 Материнская плата', keywords: 'материнская плата motherboard' },
  { value: 'ssd', label: '💿 SSD / Накопитель', keywords: 'ssd nvme накопитель диск' },
  { value: 'hdd', label: '💽 HDD', keywords: 'hdd жесткий диск' },
  { value: 'psu', label: '🔋 PSU / Блок питания', keywords: 'блок питания psu' },
  { value: 'case', label: '📦 Корпус', keywords: 'корпус case' },
  { value: 'cooler', label: '❄️ Кулер / Охлаждение', keywords: 'кулер охлаждение cooling' },
];

const CONDITION_LABELS = {
  new: '✨ Новое',
  'like-new': '⭐ Как новое',
  good: '✅ Хорошее',
  fair: '⚠️ Среднее',
};

export function OLXSearchPanel({ onClose }: OLXSearchPanelProps) {
  const { workspace, addCard } = useStore();
  const { t } = useTranslation(workspace.settings.language);
  const [searchQuery, setSearchQuery] = useState('');
  const [componentType, setComponentType] = useState('gpu');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, string>>({});
  
  // PC Build Mode
  const [buildMode, setBuildMode] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    setIsLoading(true);
    
    // Simulate API call - в реальности здесь будет парсинг OLX
    setTimeout(() => {
      let mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'RX 580 8GB Sapphire Nitro+',
          price: 250,
          currency: 'zł',
          condition: 'like-new',
          location: 'Warszawa',
          url: 'https://olx.pl/example1',
          description: 'Отличное состояние, без майнинга, тесты прилагаются',
        },
        {
          id: '2',
          title: 'Gigabyte RX 580 Gaming 8GB',
          price: 280,
          currency: 'zł',
          condition: 'good',
          location: 'Kraków',
          url: 'https://olx.pl/example2',
          description: 'Работает отлично, цена договорная',
        },
        {
          id: '3',
          title: 'MSI RX 580 Armor 8GB',
          price: 230,
          currency: 'zł',
          condition: 'fair',
          location: 'Poznań',
          url: 'https://olx.pl/example3',
          description: 'Есть небольшие царапины на корпусе',
        },
        {
          id: '4',
          title: 'Asus RX 580 Dual 8GB',
          price: 320,
          currency: 'zł',
          condition: 'new',
          location: 'Gdańsk',
          url: 'https://olx.pl/example4',
          description: 'Новая в упаковке, гарантия 2 года',
        },
        {
          id: '5',
          title: 'PowerColor RX 580 Red Devil 8GB',
          price: 265,
          currency: 'zł',
          condition: 'good',
          location: 'Wrocław',
          url: 'https://olx.pl/example5',
          description: 'Майнинг 6 месяцев, новые термопрокладки',
        },
      ];

      // Apply filters
      mockResults = mockResults.filter(item => {
        if (minPrice && item.price < parseInt(minPrice)) return false;
        if (maxPrice && item.price > parseInt(maxPrice)) return false;
        if (condition !== 'all' && item.condition !== condition) return false;
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });

      // Apply sorting
      mockResults.sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'newest':
          default:
            return 0; // Keep original order for mock data
        }
      });
      
      setResults(mockResults);
      setIsLoading(false);
    }, 1500);
  };

  const handleAddToBoard = (result: SearchResult, targetColumn?: string) => {
    // Find the marketplace tab or current tab
    const marketplaceTab = workspace.tabs.find(tab => tab.template === 'marketplace');
    const targetTab = marketplaceTab || workspace.tabs[0];
    
    if (!targetTab) return;

    const firstColumn = targetTab.columns[0];
    if (!firstColumn) return;

    addCard({
      title: result.title,
      description: `## 💰 Цена: ${result.price} ${result.currency}\n\n**Состояние:** ${result.condition}\n**Локация:** ${result.location}\n\n${result.description}\n\n[🔗 Посмотреть на OLX](${result.url})`,
      type: 'pc-component',
      priority: 'medium',
      tags: [componentType, 'olx', 'для-покупки'],
      reminders: [],
      attachments: [],
      images: [],
      checklist: [
        { id: Date.now().toString(), text: 'Связаться с продавцом', completed: false },
        { id: (Date.now() + 1).toString(), text: 'Договориться о встрече', completed: false },
        { id: (Date.now() + 2).toString(), text: 'Проверить товар', completed: false },
      ],
      comments: [],
      columnId: firstColumn.id,
      componentType: componentType,
      condition: result.condition as ComponentCondition || 'good',
      marketPrice: result.price,
      olxLink: result.url,
    });

    toast.success('Компонент добавлен на доску!');
  };

  const toggleComponentSelection = (result: SearchResult) => {
    setSelectedComponents(prev => {
      const isSelected = prev.some(c => c.id === result.id);
      if (isSelected) {
        return prev.filter(c => c.id !== result.id);
      } else {
        return [...prev, result];
      }
    });
  };

  const handleCreateBuild = () => {
    if (selectedComponents.length === 0) {
      toast.error('Выберите хотя бы один компонент');
      return;
    }

    const marketplaceTab = workspace.tabs.find(tab => tab.template === 'marketplace');
    const targetTab = marketplaceTab || workspace.tabs[0];
    
    if (!targetTab) return;
    const firstColumn = targetTab.columns[0];
    if (!firstColumn) return;

    const totalPrice = selectedComponents.reduce((sum, c) => sum + c.price, 0);
    const componentsList = selectedComponents.map(c => 
      `- **${c.title}** - ${c.price} ${c.currency} (${CONDITION_LABELS[c.condition as keyof typeof CONDITION_LABELS]})`
    ).join('\n');

    addCard({
      title: `🖥️ PC Build - ${selectedComponents.length} компонентов`,
      description: `## 💰 Общая стоимость: ${totalPrice} zł\n\n### Компоненты:\n${componentsList}\n\n### Ссылки:\n${selectedComponents.map((c, i) => `${i+1}. [${c.title}](${c.url})`).join('\n')}`,
      type: 'pc-build',
      priority: 'high',
      tags: ['pc-build', 'olx', 'сборка'],
      reminders: [],
      attachments: [],
      images: [],
      checklist: selectedComponents.map((c, i) => ({
        id: `${Date.now()}-${i}`,
        text: `Купить: ${c.title}`,
        completed: false,
      })),
      comments: [],
      columnId: firstColumn.id,
    });

    toast.success(`Создана сборка из ${selectedComponents.length} компонентов!`);
    setSelectedComponents([]);
    setBuildMode(false);
  };

  const handleAnalyzeWithAI = async (result: SearchResult) => {
    if (!workspace.settings.aiProvider || workspace.settings.aiProvider === 'none') {
      alert('Настройте AI в настройках для использования анализа');
      return;
    }

    setAnalyzingId(result.id);
    
    try {
      const aiService = new AIService({
        provider: workspace.settings.aiProvider,
        apiKey: workspace.settings.aiApiKey,
        model: workspace.settings.aiModel,
        ollamaUrl: workspace.settings.ollamaUrl,
      });

      const analysis = await analyzeOLXListing(
        {
          title: result.title,
          price: result.price,
          description: result.description,
          category: componentType,
        },
        aiService
      );

      setAnalyses(prev => ({ ...prev, [result.id]: analysis }));
    } catch (error) {
      console.error('AI analysis error:', error);
      setAnalyses(prev => ({ 
        ...prev, 
        [result.id]: 'Ошибка анализа. Проверьте настройки AI.' 
      }));
    } finally {
      setAnalyzingId(null);
    }
  };

  const selectedComponent = PC_COMPONENTS.find(c => c.value === componentType);
  const totalBuildPrice = selectedComponents.reduce((sum, c) => sum + c.price, 0);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-4xl flex-col border-l border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Package className="size-5 text-primary" />
          <h2>OLX Поиск компонентов ПК</h2>
          <Badge variant="outline" className="text-xs">Ctrl+K</Badge>
          
          {/* Build Mode Toggle */}
          <Button
            variant={buildMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setBuildMode(!buildMode);
              if (buildMode) setSelectedComponents([]);
            }}
          >
            <Wrench className="mr-2 size-4" />
            {buildMode ? `Режим сборки (${selectedComponents.length})` : 'Режим сборки'}
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      {/* Search Controls */}
      <div className="border-b border-border bg-muted/30 p-4">
        <div className="grid gap-4">
          {/* Row 1: Component Type & Search Query */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Тип компонента</label>
              <Select value={componentType} onValueChange={setComponentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PC_COMPONENTS.map((comp) => (
                    <SelectItem key={comp.value} value={comp.value}>
                      {comp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Поиск (модель, характеристики)</label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Например: RX 580 8GB"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </div>
          </div>

          {/* Row 2: Price Range & Condition */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Мин. цена (zł)</label>
              <Input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Макс. цена (zł)</label>
              <Input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Состояние</label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Любое</SelectItem>
                  <SelectItem value="new">✨ Новое</SelectItem>
                  <SelectItem value="like-new">⭐ Как новое</SelectItem>
                  <SelectItem value="good">✅ Хорошее</SelectItem>
                  <SelectItem value="fair">⚠️ Среднее</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Сортировка</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">🕒 Новые</SelectItem>
                  <SelectItem value="price-asc">💰 Дешевле</SelectItem>
                  <SelectItem value="price-desc">💎 Дороже</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSearch} disabled={isLoading} className="w-full">
            <Search className="mr-2 size-4" />
            {isLoading ? 'Ищем...' : 'Найти на OLX & Allegro'}
          </Button>
        </div>

        <div className="mt-3 rounded-lg bg-blue-500/10 p-3 text-blue-600">
          <p className="flex items-center gap-2 text-sm">
            <TrendingUp className="size-4" />
            <strong>Поиск:</strong> {selectedComponent?.label}
            {minPrice && ` | От ${minPrice} zł`}
            {maxPrice && ` | До ${maxPrice} zł`}
            {condition !== 'all' && ` | Состояние: ${condition}`}
          </p>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <Skeleton className="mb-2 h-6 w-3/4" />
                <Skeleton className="mb-2 h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Найдено: {results.length} объявлений
            </p>
            {results.map((result) => {
              const isSelected = selectedComponents.some(c => c.id === result.id);
              
              return (
              <div
                key={result.id}
                className={`group rounded-lg border p-4 transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border bg-card hover:border-primary hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {buildMode && (
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          size="icon"
                          className="size-6"
                          onClick={() => toggleComponentSelection(result)}
                        >
                          {isSelected ? <Check className="size-4" /> : <Plus className="size-4" />}
                        </Button>
                      )}
                      <h3>{result.title}</h3>
                    </div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        💰 {result.price} {result.currency}
                      </Badge>
                      <Badge variant="outline">
                        {CONDITION_LABELS[result.condition as keyof typeof CONDITION_LABELS] || result.condition}
                      </Badge>
                      <Badge variant="outline">📍 {result.location}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.description}
                    </p>
                  </div>
                </div>

                {!buildMode && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddToBoard(result)}
                    className="flex-1"
                  >
                    <Plus className="mr-2 size-4" />
                    Добавить на доску
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAnalyzeWithAI(result)}
                    disabled={analyzingId === result.id}
                  >
                    <Sparkles className="mr-2 size-4" />
                    {analyzingId === result.id ? 'Анализ...' : 'AI анализ'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(result.url, '_blank')}
                  >
                    <ExternalLink className="size-4" />
                  </Button>
                </div>
                )}

                {/* AI Analysis Result */}
                {analyses[result.id] && (
                  <div className="prose prose-sm dark:prose-invert mt-3 max-w-none rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold not-prose">
                      <Sparkles className="size-4 text-primary" />
                      AI Анализ экспертом
                    </div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analyses[result.id]}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-4 size-16 text-muted-foreground opacity-50" />
            <h3 className="mb-2">Начните поиск</h3>
            <p className="text-muted-foreground">
              Выберите тип компонента и нажмите "Найти"
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border bg-muted/30 p-4">
        {buildMode && selectedComponents.length > 0 ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Выбрано компонентов: {selectedComponents.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Общая стоимость: <span className="font-semibold text-green-600">{totalBuildPrice} zł</span>
                  </p>
                </div>
                <Button onClick={handleCreateBuild} size="lg" className="gap-2">
                  <Wrench className="size-5" />
                  Создать сборку
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedComponents.map(c => (
                <Badge key={c.id} variant="secondary" className="gap-1">
                  {c.title.slice(0, 20)}... - {c.price} zł
                  <X 
                    className="size-3 cursor-pointer hover:text-destructive" 
                    onClick={() => toggleComponentSelection(c)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>💡 Совет:</strong> {buildMode 
                ? 'Выберите компоненты из результатов поиска для создания сборки ПК' 
                : 'После добавления карточки вы сможете:'}
            </p>
            {!buildMode && (
              <ul className="list-inside list-disc space-y-1 pl-4">
                <li>Загрузить фото компонента (вкладка "Фото")</li>
                <li>Добавить заметки о состоянии и тестах</li>
                <li>Отследить цену и сравнить с рынком</li>
                <li>Использовать AI для анализа объявления</li>
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
