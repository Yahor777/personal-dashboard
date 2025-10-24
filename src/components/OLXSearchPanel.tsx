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

// Marketplace options
const MARKETPLACES = [
  { value: 'olx', label: '🏪 OLX.pl', url: 'https://www.olx.pl', searchPath: '/search' },
  { value: 'ceneo', label: '💰 Ceneo.pl', url: 'https://www.ceneo.pl', searchPath: '/search' },
  { value: 'xkom', label: '⚡ x-kom', url: 'https://www.x-kom.pl', searchPath: '/szukaj' },
  { value: 'mediaexpert', label: '🎯 MediaExpert', url: 'https://www.mediaexpert.pl', searchPath: '/szukaj' },
];

interface SearchResult {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  location: string;
  url: string;
  image?: string;
  images?: string[];
  description: string;
  marketplace?: string;
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
  const [marketplace, setMarketplace] = useState('olx');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('all');
  const [location, setLocation] = useState('all');
  const [delivery, setDelivery] = useState('all');
  const [sellerType, setSellerType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, string | { offerId: string; short: string; full: string }>>({});
  const [aiSearching, setAiSearching] = useState(false);
  
  // PC Build Mode
  const [buildMode, setBuildMode] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<SearchResult[]>([]);

  const handleAISearch = async () => {
    if (!workspace.settings.aiProvider || workspace.settings.aiProvider === 'none') {
      toast.error('⚠️ Настройте AI в Settings для использования умного поиска!');
      return;
    }

    if (!searchQuery.trim()) {
      toast.error('Введите запрос для AI поиска');
      return;
    }

    setAiSearching(true);
    setIsLoading(true);
    
    try {
      const aiService = new AIService({
        provider: workspace.settings.aiProvider,
        apiKey: workspace.settings.aiApiKey,
        model: workspace.settings.aiModel,
        ollamaUrl: workspace.settings.ollamaUrl,
      });

      // Ask AI to enhance search query
      const prompt = `Ты эксперт по компьютерным комплектующим. Пользователь ищет: "${searchQuery}"
Маркетплейс: ${MARKETPLACES.find(m => m.value === marketplace)?.label}

Задача: проанализируй запрос и предложи:
1. Лучшие ключевые слова для поиска на выбранном маркетплейсе (польский рынок)
2. Рекомендуемую категорию компонента (gpu, cpu, ram и т.д.)
3. Примерный ценовой диапазон в злотых (PLN)
4. На что обратить внимание при покупке

Верни ответ в формате JSON:
{
  "keywords": "улучшенные ключевые слова",
  "component": "тип компонента",
  "priceRange": {"min": 100, "max": 500},
  "tips": "советы по выбору"
}`;

      const result = await aiService.chat([
        { role: 'user', content: prompt }
      ]);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Try to extract JSON from response
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiResult = JSON.parse(jsonMatch[0]);
        
        // Update search query with AI suggestions
        const enhancedQuery = aiResult.searchTerms?.[0] || searchQuery;
        setSearchQuery(enhancedQuery);
        
        // Show AI suggestions
        toast.success(`🤖 AI рекомендует искать: "${enhancedQuery}"`, {
          description: `Цена: ${aiResult.priceRange?.min || '?'}-${aiResult.priceRange?.max || '?'} zł`,
          duration: 5000,
        });
        
        // Auto-set price range if provided
        if (aiResult.priceRange) {
          setMinPrice(aiResult.priceRange.min.toString());
          setMaxPrice(aiResult.priceRange.max.toString());
        }
        
        // Trigger regular search with enhanced query
        setTimeout(() => handleSearch(), 500);
      } else {
        // AI didn't return JSON, just use the response as enhanced query
        toast.success('🤖 AI обработал ваш запрос');
        handleSearch();
      }
    } catch (error) {
      console.error('AI search error:', error);
      toast.error('Ошибка AI поиска. Проверьте настройки AI.');
    } finally {
      setAiSearching(false);
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    
    // Build search query based on selected marketplace
    const searchTerm = searchQuery || selectedComponent?.keywords.split(' ')[0] || 'RX 580';
    const selectedMarketplace = MARKETPLACES.find(m => m.value === marketplace) || MARKETPLACES[0];
    
    try {
      // Call backend API
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      
      const response = await fetch(`${BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchTerm,
          marketplace: marketplace,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          category: componentType,
          location: location !== 'all' ? location : undefined,
          maxPages: 3,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Apply additional client-side filters
      let filteredResults = data.results || [];
      
      // Search query filter
      if (searchQuery) {
        filteredResults = filteredResults.filter((item: SearchResult) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Condition filter
      if (condition !== 'all') {
        filteredResults = filteredResults.filter((item: SearchResult) => item.condition === condition);
      }

      // Apply sorting
      filteredResults.sort((a: SearchResult, b: SearchResult) => {
        switch (sortBy) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'newest':
          default:
            return 0;
        }
      });
      
      setResults(filteredResults);
      
      if (filteredResults.length > 0) {
        toast.success(`Найдено ${filteredResults.length} объявлений на ${selectedMarketplace.label}`, {
          description: data.source === 'cache' ? 'Из кэша' : 'Свежие данные',
        });
      } else {
        toast.info('Ничего не найдено', {
          description: 'Попробуйте изменить параметры поиска',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      
      // Fallback: Build direct marketplace URL with filters
      let searchUrl = '';
      const priceFilter = minPrice || maxPrice ? `&price_from=${minPrice || ''}&price_to=${maxPrice || ''}` : '';
      
      switch (marketplace) {
        case 'olx':
          // OLX новый формат URL
          searchUrl = `https://www.olx.pl/d/oferty/q-${encodeURIComponent(searchTerm)}/?search[filter_enum_condition][0]=used${priceFilter ? `&search[filter_float_price:from]=${minPrice || ''}&search[filter_float_price:to]=${maxPrice || ''}` : ''}`;
          break;
        case 'ceneo':
          searchUrl = `https://www.ceneo.pl/;szukaj-${encodeURIComponent(searchTerm)}${priceFilter ? `;price_from=${minPrice || ''};price_to=${maxPrice || ''}` : ''}`;
          break;
        case 'xkom':
          searchUrl = `https://www.x-kom.pl/szukaj?q=${encodeURIComponent(searchTerm)}${minPrice ? `&f201-0=${minPrice}` : ''}${maxPrice ? `&f201-1=${maxPrice}` : ''}`;
          break;
        case 'mediaexpert':
          searchUrl = `https://www.mediaexpert.pl/szukaj?query[querystring]=${encodeURIComponent(searchTerm)}`;
          break;
      }
      
      toast.warning('Backend scraper недоступен', {
        description: `Открываю поиск на ${selectedMarketplace.label} в новой вкладке`,
        duration: 5000,
      });
      
      // Автоматически открываем ссылку
      window.open(searchUrl, '_blank');
      
      setResults([]);
    } finally {
      setIsLoading(false);
    }
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
          id: result.id,
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
    <div data-panel="true" className="fixed z-50 flex w-full md:max-w-4xl flex-col bg-background shadow-2xl md:inset-y-0 md:right-0 md:left-auto inset-x-0 top-14 bottom-16 border-border md:border-l md:border-t-0 border-t">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 pt-safe">
        <div className="flex items-center gap-3">
          <Package className="size-5 text-primary" />
          <h2>🛒 Поиск на маркетплейсах</h2>
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
      <div className="border-b border-border bg-muted p-4">
        <div className="grid gap-4">
          {/* Marketplace Selector */}
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium">Маркетплейс:</span>
            <div className="flex gap-2 flex-wrap">
              {MARKETPLACES.map((m) => (
                <Button
                  key={m.value}
                  variant={marketplace === m.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarketplace(m.value)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Main Search Bar */}
          <div className="flex gap-2 flex-wrap">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Что ищете? Например: RX 580 8GB"
              className="flex-1 min-w-[220px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <Button 
              onClick={handleAISearch} 
              disabled={isLoading || aiSearching}
              variant="outline"
              className="border-primary/50 hover:bg-primary/10"
            >
              <Sparkles className="mr-2 size-4" />
              AI Поиск
            </Button>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="mr-2 size-4" />
              Поиск
            </Button>
          </div>

          {/* Filters Row 1: Category & Location */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Категория</label>
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
              <label className="text-xs font-medium text-muted-foreground">📍 Локация</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Вся Польша</SelectItem>
                  <SelectItem value="Warszawa">Warszawa</SelectItem>
                  <SelectItem value="Kraków">Kraków</SelectItem>
                  <SelectItem value="Poznań">Poznań</SelectItem>
                  <SelectItem value="Gdańsk">Gdańsk</SelectItem>
                  <SelectItem value="Wrocław">Wrocław</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters Row 2: Price Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Цена от (zł)</label>
              <Input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Цена до (zł)</label>
              <Input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="10000"
              />
            </div>
          </div>

          {/* Filters Row 3: Condition, Delivery, Seller */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Состояние</label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Любое</SelectItem>
                  <SelectItem value="new">Новое</SelectItem>
                  <SelectItem value="like-new">Как новое</SelectItem>
                  <SelectItem value="good">Хорошее</SelectItem>
                  <SelectItem value="fair">Среднее</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">📦 Доставка</label>
              <Select value={delivery} onValueChange={setDelivery}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Не важно</SelectItem>
                  <SelectItem value="available">Есть доставка</SelectItem>
                  <SelectItem value="pickup">Только самовывоз</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">👤 Продавец</label>
              <Select value={sellerType} onValueChange={setSellerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="private">Частное лицо</SelectItem>
                  <SelectItem value="business">Компания</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground">Сортировка:</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Новые</SelectItem>
                <SelectItem value="price-asc">Сначала дешевые</SelectItem>
                <SelectItem value="price-desc">Сначала дорогие</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Info */}
        <div className="mt-3 flex flex-wrap gap-2">
          {minPrice && <Badge variant="secondary">От {minPrice} zł</Badge>}
          {maxPrice && <Badge variant="secondary">До {maxPrice} zł</Badge>}
          {condition !== 'all' && <Badge variant="secondary">{CONDITION_LABELS[condition as keyof typeof CONDITION_LABELS]}</Badge>}
          {location !== 'all' && <Badge variant="secondary">📍 {location}</Badge>}
          {delivery !== 'all' && <Badge variant="secondary">📦 {delivery === 'available' ? 'С доставкой' : 'Самовывоз'}</Badge>}
          {sellerType !== 'all' && <Badge variant="secondary">👤 {sellerType === 'private' ? 'Частник' : 'Бизнес'}</Badge>}
        </div>
      </div>

      {/* Results - with proper scroll */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea data-scroll-area className="h-full pb-bottom-nav">
          <div className="p-4">
            {/* BEST FREE METHOD INFO */}
            {results.length === 0 && !isLoading && 
              <div className="mb-6 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-primary">
                  <Sparkles className="size-5" />
                  🎯 Лучший БЕСПЛАТНЫЙ способ поиска комплектующих
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="rounded-md bg-background p-3">
                    <p className="font-medium mb-2">🔥 Рекомендация #1: OLX.pl (б/у рынок)</p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Самые низкие цены (часто в 2-3 раза дешевле новых)</li>
                      <li>• Огромный выбор б/у компонентов</li>
                      <li>• Можно торговаться с продавцом</li>
                      <li>• ⚠️ Проверяйте продавца и состояние товара!</li>
                    </ul>
                  </div>

                  <div className="rounded-md bg-background p-3">
                    <p className="font-medium mb-2">💰 Рекомендация #2: Ceneo.pl (сравнение цен)</p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Сравнивает цены во ВСЕХ польских магазинах</li>
                      <li>• Показывает историю цен и скидки</li>
                      <li>• Новые товары с гарантией</li>
                      <li>• Отзывы и рейтинги</li>
                    </ul>
                  </div>

                  <div className="rounded-md bg-background p-3">
                    <p className="font-medium mb-2">⚡ Рекомендация #3: x-kom & MediaExpert (акции)</p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Регулярные распродажи и акции</li>
                      <li>• Рассрочка 0% на крупные покупки</li>
                      <li>• Быстрая доставка по Польше</li>
                      <li>• Официальная гарантия производителя</li>
                    </ul>
                  </div>

                  <div className="mt-4 rounded-md bg-yellow-500/10 p-3 border border-yellow-500/20">
                    <p className="font-medium text-yellow-600 dark:text-yellow-500 mb-2">💡 Совет эксперта:</p>
                    <p className="text-sm text-muted-foreground">
                      Сначала проверьте цены на <strong>Ceneo.pl</strong> (узнаете рыночную стоимость), 
                      потом ищите на <strong>OLX.pl</strong> (найдете б/у дешевле в 2-3 раза). 
                      Для новых компонентов следите за акциями на <strong>x-kom</strong> и <strong>MediaExpert</strong>!
                    </p>
                  </div>
                </div>
              </div>
              }

              {/* Results content - simplified conditionals */}
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-4">
                      <Skeleton className="mb-2 h-6 w-3/4" />
                      <Skeleton className="mb-2 h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <div className="space-y-3">
                  <p className="text-muted-foreground">Найдено: {results.length} объявлений</p>
                  {results.map((result) => {
                    const isSelected = selectedComponents.some(c => c.id === result.id);
                    const analysis = analyses[result.id];
                    return (
                      <div
                        key={result.id || result.url || result.title}
                        className={`group rounded-lg border p-3 md:p-4 transition-all ${selectedOfferId === result.id ? 'ring-2 ring-primary' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {Array.isArray(result.images) && result.images.length > 0 && (
                              <div className="mb-2 -mx-4 md:mx-0">
                                <div className="flex gap-2 overflow-x-auto" data-scroll-x>
                                  {result.images.map((src, idx) => (
                                    <img
                                      key={idx}
                                      src={src}
                                      alt={`${result.title} ${idx + 1}`}
                                      className="h-28 md:h-40 w-auto flex-shrink-0 rounded"
                                      loading="lazy"
                                      draggable={false}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mb-1 md:mb-2 flex items-center gap-2">
                              <h3 className="text-sm md:text-base font-semibold">{result.title}</h3>
                              {result.condition && (
                                <Badge variant="secondary" className="text-xs md:text-sm">
                                  {result.condition}
                                </Badge>
                              )}
                              {result.location && (
                                <Badge variant="outline" className="text-xs md:text-sm">
                                  {result.location}
                                </Badge>
                              )}
                            </div>

                            {result.price && (
                              <div className="mb-1 md:mb-2 text-sm md:text-base font-medium text-primary">
                                {result.price}
                              </div>
                            )}

                            {result.description && (
                              <p className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap">
                                {result.description}
                              </p>
                            )}

                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigator.clipboard.writeText(result.description || '')}
                              >
                                Готовое описание: копировать
                              </Button>
                            </div>
                          </div>

                          {/* Действия по объявлению */}
                          {!buildMode && (
                            <div className="mt-3 flex gap-2">
                              <Button size="sm" onClick={() => handleAddToBoard(result)} className="flex-1">
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
                              <Button size="sm" variant="outline" onClick={() => window.open(result.url, '_blank')}>
                                <ExternalLink className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* AI analysis display */}
                        {analysis && (
                          <div className="mt-3 md:mt-4 rounded-md border bg-muted/30 p-2 md:p-3">
                            {typeof analysis === 'string' ? (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
                            ) : analysis.offerId === result.id ? (
                              <>
                                <p className="text-sm md:text-base">{analysis.short}</p>
                                <div className="mt-2">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.full}</ReactMarkdown>
                                </div>
                                <div className="mt-2 flex gap-2">
                                  <Button size="sm" onClick={() => navigator.clipboard.writeText(analysis.short)}>
                                    Копировать краткое
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(analysis.full)}>
                                    Копировать полное
                                  </Button>
                                </div>
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!isLoading && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="mb-4 size-16 text-muted-foreground opacity-50" />
                  <h3 className="mb-2">Начните поиск</h3>
                  <p className="text-muted-foreground">Выберите тип компонента и нажмите «Найти»</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted p-4 pb-bottom-nav">
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
            <div className="space-y-3 text-sm">
              {/* Real-time search info */}
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-primary">
                <p className="flex items-center gap-2 font-semibold">
                  <TrendingUp className="size-4" />
                  ✅ Реальный поиск активен
                </p>
                <p className="mt-1 text-xs opacity-90">
                  Данные загружаются с маркетплейсов в реальном времени. 
                  Backend сервер должен быть запущен (localhost:3002)
                </p>
              </div>

              <div className="text-muted-foreground">
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
            </div>
          )}
        </div>
      </div>
    );
}
