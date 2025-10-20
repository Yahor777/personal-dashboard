import { useState, useEffect, type ReactNode } from 'react';
import { X, Search, MapPin, Tag, DollarSign, Eye, ExternalLink, Star, TrendingUp, Filter, Clock, Heart, Bookmark, History, Grid, List, ChevronLeft, ChevronRight, BarChart3, Download, Loader2, AlertCircle, RefreshCw, Share2, Award, ThumbsUp, ThumbsDown, Zap, AlertTriangle, Cpu, MonitorSmartphone, Gauge, Sparkles, Truck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { toast } from 'sonner';
import { POLISH_CITIES, ITEM_CONDITIONS, PRICE_PRESETS, OLX_CATEGORIES, SELLER_TYPES, DATE_FILTERS, SORT_OPTIONS, PC_BRANDS, buildOLXUrl } from '../data/olxCategories';
import { filterOLXListings, type OLXListing } from '../data/mockOLXData';
import { analyzeOffer, getTopOffers, getOffersToAvoid, type AIRecommendation } from '../utils/aiAnalyzer';
import { savePreference, getPreferenceForListing, getPreferenceStats } from '../utils/userPreferences';

interface OLXMarketplaceProps {
  onClose: () => void;
}

type QuickSearchConfig = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  query: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  withDelivery?: boolean;
};

interface QuickFilterBlockProps {
  label: string;
  children: ReactNode;
  compact?: boolean;
}

const QuickFilterBlock = ({ label, children, compact = false }: QuickFilterBlockProps) => (
  <div className={`flex flex-col gap-1 ${compact ? 'min-w-[140px]' : ''}`}>
    <span className="text-[11px] uppercase tracking-wide text-muted-foreground/90">
      {label}
    </span>
    <div className="flex items-center gap-2">
      {children}
    </div>
  </div>
);

const QUICK_SEARCHES: QuickSearchConfig[] = [
  {
    id: 'gaming-budget',
    title: '🎮 Бюджетный игровой ПК',
    description: 'RTX 3060 | Ryzen 5 | до 3000 zł',
    icon: <MonitorSmartphone className="size-5 text-orange-500" />,
    query: 'RTX 3060',
    city: 'warszawa',
    maxPrice: 3000,
    withDelivery: true,
  },
  {
    id: 'productivity',
    title: '💼 ПК для работы',
    description: 'Ryzen 5 5600X | 32GB RAM',
    icon: <Cpu className="size-5 text-blue-500" />,
    query: 'Ryzen 5 5600X',
    city: 'krakow',
    minPrice: 400,
    maxPrice: 900,
    withDelivery: true,
  },
  {
    id: 'upgrade-ssd',
    title: '⚡ SSD апгрейд',
    description: 'NVMe 1TB | доставка OLX',
    icon: <Gauge className="size-5 text-green-500" />,
    query: 'NVMe 1TB',
    city: 'wroclaw',
    minPrice: 250,
    maxPrice: 450,
    withDelivery: true,
  },
  {
    id: 'rgb-build',
    title: '✨ RGB билды',
    description: 'NZXT H510 | RTX 3070 Ti',
    icon: <Sparkles className="size-5 text-purple-500" />,
    query: 'NZXT H510',
    city: 'poznan',
  },
];

export function OLXMarketplace({ onClose }: OLXMarketplaceProps) {
  // Check backend status on mount
  useEffect(() => {
    checkBackendStatus();
    loadUserPreferences();
  }, []);
  
  // Загрузить сохранённые предпочтения
  const loadUserPreferences = () => {
    const prefs = new Map<string, 'like' | 'dislike'>();
    results.forEach(listing => {
      const pref = getPreferenceForListing(listing.id);
      if (pref !== 'neutral') {
        prefs.set(listing.id, pref);
      }
    });
    setUserPreferences(prefs);
    
    const stats = getPreferenceStats();
    console.log('[Preferences] Loaded:', stats);
  };

  const checkBackendStatus = async () => {
    setBackendStatus('checking');
    try {
      const response = await fetch('http://localhost:3002/health', {
        method: 'GET',
      });
      if (response.ok) {
        setBackendStatus('online');
        toast.success('Backend подключен', { description: 'Доступен реальный поиск OLX' });
      } else {
        setBackendStatus('offline');
      }
    } catch (error) {
      setBackendStatus('offline');
      toast.info('Backend недоступен', { description: 'Используются mock данные' });
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('pc-components');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedSellerType, setSelectedSellerType] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('date_desc');
  const [withDelivery, setWithDelivery] = useState(false); // 🚚 Фильтр доставки OLX
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [results, setResults] = useState<OLXListing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    // Загружаем избранное из localStorage
    const saved = localStorage.getItem('olx-favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [savedSearches, setSavedSearches] = useState<Array<{name: string; params: any}>>(() => {
    // Загружаем сохранённые поиски из localStorage
    const saved = localStorage.getItem('olx-saved-searches');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedListing, setSelectedListing] = useState<OLXListing | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [comparisonList, setComparisonList] = useState<Set<string>>(new Set());
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<Map<string, AIRecommendation>>(new Map());
  const [userPreferences, setUserPreferences] = useState<Map<string, 'like' | 'dislike'>>(new Map());
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    const handleChange = (event: MediaQueryList | MediaQueryListEvent) => {
      const matches = 'matches' in event ? event.matches : (event as MediaQueryList).matches;
      setIsDesktop(matches);
      if (!matches) {
        setShowFilters(false);
      }
    };

    handleChange(mediaQuery);

    const listener = handleChange as (event: MediaQueryListEvent) => void;
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      // @ts-ignore legacy support
      mediaQuery.addListener(listener);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      } else {
        // @ts-ignore legacy support
        mediaQuery.removeListener(listener);
      }
    };
  }, []);

  const renderQuickFilters = () => (
    <div className="mt-6">
      <div className="hidden xl:grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 p-4 bg-muted/20 border border-border/50 rounded-xl">
        <QuickFilterBlock label="Город">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Вся Польша" />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              {POLISH_CITIES.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </QuickFilterBlock>

        <QuickFilterBlock label="Категория">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              {OLX_CATEGORIES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </QuickFilterBlock>

        <QuickFilterBlock label="Бренд">
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Все бренды" />
            </SelectTrigger>
            <SelectContent className="max-h-[240px]">
              <SelectItem value="all">Все бренды</SelectItem>
              {PC_BRANDS.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </QuickFilterBlock>

        <QuickFilterBlock label="Цена">
          <div className="flex items-center gap-2">
            <Input
              placeholder="От"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-9 text-sm"
            />
            <Input
              placeholder="До"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </QuickFilterBlock>

        <QuickFilterBlock label="Состояние">
          <Select value={selectedCondition} onValueChange={setSelectedCondition}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Любое" />
            </SelectTrigger>
            <SelectContent>
              {ITEM_CONDITIONS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </QuickFilterBlock>

        <QuickFilterBlock label="Тип продавца">
          <Select value={selectedSellerType} onValueChange={setSelectedSellerType}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Любой" />
            </SelectTrigger>
            <SelectContent>
              {SELLER_TYPES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </QuickFilterBlock>

        <QuickFilterBlock label="Дата">
          <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Любая" />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTERS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </QuickFilterBlock>

        <QuickFilterBlock label="Сортировка">
          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="По умолчанию" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </QuickFilterBlock>

        <QuickFilterBlock label="Доставка OLX">
          <Button
            variant={withDelivery ? 'default' : 'outline'}
            size="sm"
            className="h-9 text-sm"
            onClick={() => setWithDelivery(!withDelivery)}
          >
            {withDelivery ? 'Только с доставкой' : 'Включить доставку'}
          </Button>
        </QuickFilterBlock>

        <QuickFilterBlock label="Дополнительно">
          <Button
            variant="secondary"
            size="sm"
            className="h-9 text-sm"
            onClick={() => setShowFilters(true)}
          >
            Все фильтры
          </Button>
        </QuickFilterBlock>
      </div>

      <div className="xl:hidden">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-4 py-3 px-4 w-max bg-muted/20 border border-border/50 rounded-xl">
            <QuickFilterBlock label="Город" compact>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-9 text-sm w-[160px]">
                  <SelectValue placeholder="Вся Польша" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {POLISH_CITIES.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </QuickFilterBlock>

            <QuickFilterBlock label="Категория" compact>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-sm w-[160px]">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  {OLX_CATEGORIES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </QuickFilterBlock>

            <QuickFilterBlock label="Бренд" compact>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="h-9 text-sm w-[160px]">
                  <SelectValue placeholder="Все бренды" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  <SelectItem value="all">Все бренды</SelectItem>
                  {PC_BRANDS.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </QuickFilterBlock>

            <QuickFilterBlock label="Цена" compact>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="От"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-9 text-sm w-[120px]"
                />
                <Input
                  placeholder="До"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-9 text-sm w-[120px]"
                />
              </div>
            </QuickFilterBlock>

            <QuickFilterBlock label="Состояние" compact>
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="h-9 text-sm w-[150px]">
                  <SelectValue placeholder="Любое" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CONDITIONS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </QuickFilterBlock>

            <QuickFilterBlock label="Тип продавца" compact>
              <Select value={selectedSellerType} onValueChange={setSelectedSellerType}>
                <SelectTrigger className="h-9 text-sm w-[150px]">
                  <SelectValue placeholder="Любой" />
                </SelectTrigger>
                <SelectContent>
                  {SELLER_TYPES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </QuickFilterBlock>

            <QuickFilterBlock label="Дата" compact>
              <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
                <SelectTrigger className="h-9 text-sm w-[150px]">
                  <SelectValue placeholder="Любая" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FILTERS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </QuickFilterBlock>

            <QuickFilterBlock label="Сортировка" compact>
              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="h-9 text-sm w-[150px]">
                  <SelectValue placeholder="По умолчанию" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </QuickFilterBlock>

            <QuickFilterBlock label="Доставка OLX" compact>
              <Button
                variant={withDelivery ? 'default' : 'outline'}
                size="sm"
                className="h-9 text-sm"
                onClick={() => setWithDelivery(!withDelivery)}
              >
                {withDelivery ? 'Только с доставкой' : 'Включить доставку'}
              </Button>
            </QuickFilterBlock>

            <QuickFilterBlock label="Дополнительно" compact>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 text-sm"
                onClick={() => setShowFilters(true)}
              >
                Все фильтры
              </Button>
            </QuickFilterBlock>
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
      </div>
    </div>
  );

  const renderFiltersBody = (variant: 'inline' | 'drawer' = 'drawer') => {
    const cityLabel = selectedCity !== 'all'
      ? POLISH_CITIES.find((city) => city.id === selectedCity)?.name ?? 'Польша'
      : null;
    const brandLabel = selectedBrand !== 'all'
      ? PC_BRANDS.find((brand) => brand.id === selectedBrand)?.name ?? '—'
      : null;
    const conditionLabel = selectedCondition !== 'all'
      ? ITEM_CONDITIONS.find((item) => item.id === selectedCondition)?.name ?? '—'
      : null;
    const sellerLabel = selectedSellerType !== 'all'
      ? SELLER_TYPES.find((item) => item.id === selectedSellerType)?.name ?? '—'
      : null;
    const dateLabel = selectedDateFilter !== 'all'
      ? DATE_FILTERS.find((item) => item.id === selectedDateFilter)?.name ?? '—'
      : null;
    const sortLabel = SORT_OPTIONS.find((item) => item.id === selectedSort)?.name ?? 'По релевантности';

    const activeFilters = [
      cityLabel && { label: 'Город', value: cityLabel },
      brandLabel && { label: 'Бренд', value: brandLabel },
      minPrice && { label: 'Мин. цена', value: `${minPrice} zł` },
      maxPrice && { label: 'Макс. цена', value: `${maxPrice} zł` },
      conditionLabel && { label: 'Состояние', value: conditionLabel },
      sellerLabel && { label: 'Продавец', value: sellerLabel },
      withDelivery && { label: 'Доставка', value: 'Только с доставкой OLX' },
      dateLabel && { label: 'Дата', value: dateLabel },
      sortLabel && { label: 'Сортировка', value: sortLabel },
    ].filter(Boolean) as { label: string; value: string }[];

    return (
      <div className={`space-y-5 ${variant === 'inline' ? 'p-0' : 'p-5'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Настройте подборку</p>
            <p className="text-xs text-muted-foreground/70">Фильтры влияют на выдачу и AI рекомендации</p>
          </div>
          <div className="flex items-center gap-2">
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="text-xs">{activeFilters.length} активн.</Badge>
            )}
            {variant === 'drawer' && (
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge key={filter.label} variant="outline" className="text-xs flex items-center gap-1">
                <span className="font-medium text-foreground/80">{filter.label}:</span>
                <span className="text-foreground/70">{filter.value}</span>
              </Badge>
            ))}
          </div>
        )}

        <Accordion type="multiple" className="space-y-3">
          <AccordionItem value="city" className="border border-border/60 rounded-xl bg-muted/10">
            <AccordionTrigger className="px-3 text-sm font-medium gap-2">
              <MapPin className="size-4" />
              Город
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {POLISH_CITIES.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="category" className="border border-border/60 rounded-xl bg-muted/10">
            <AccordionTrigger className="px-3 text-sm font-medium gap-2">
              <Tag className="size-4" />
              Категория
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  {OLX_CATEGORIES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="brand" className="border border-border/60 rounded-xl bg-muted/10">
            <AccordionTrigger className="px-3 text-sm font-medium gap-2">
              <Star className="size-4" />
              Бренд
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Все бренды" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  <SelectItem value="all">Все бренды</SelectItem>
                  {PC_BRANDS.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="price" className="border border-border/60 rounded-xl bg-muted/10">
            <AccordionTrigger className="px-3 text-sm font-medium gap-2">
              <DollarSign className="size-4" />
              Цена
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="От"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <Input
                  placeholder="До"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {PRICE_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      setMinPrice(preset.min ? String(preset.min) : '');
                      setMaxPrice(preset.max ? String(preset.max) : '');
                    }}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="state" className="border border-border/60 rounded-xl bg-muted/10">
            <AccordionTrigger className="px-3 text-sm font-medium gap-2">
              <Badge variant="outline" className="text-xs uppercase">Состояние</Badge>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Любое" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CONDITIONS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="seller" className="border border-border/60 rounded-xl bg-muted/10">
            <AccordionTrigger className="px-3 text-sm font-medium gap-2">
              <Bookmark className="size-4" />
              Тип продавца
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <Select value={selectedSellerType} onValueChange={setSelectedSellerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Любой" />
                </SelectTrigger>
                <SelectContent>
                  {SELLER_TYPES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="delivery" className="border border-border/60 rounded-xl bg-muted/10">
            <AccordionTrigger className="px-3 text-sm font-medium gap-2">
              <Truck className="size-4" />
              Доставка OLX
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <Button
                variant={withDelivery ? 'default' : 'outline'}
                size="sm"
                className="w-full"
                onClick={() => setWithDelivery(!withDelivery)}
              >
                {withDelivery ? '✓ Только с доставкой' : 'Включить доставку'}
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="date" className="border border-border/60 rounded-xl bg-muted/10">
            <AccordionTrigger className="px-3 text-sm font-medium gap-2">
              <Clock className="size-4" />
              Дата
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="За всё время" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FILTERS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sort" className="border border-border/60 rounded-xl bg-muted/10">
            <AccordionTrigger className="px-3 text-sm font-medium gap-2">
              <BarChart3 className="size-4" />
              Сортировка
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger>
                  <SelectValue placeholder="По умолчанию" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {searchHistory.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <History className="size-4" />
              Недавние запросы
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((item, index) => (
                <Button
                  key={`${item}-${index}`}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSearchQuery(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        )}

        {savedSearches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bookmark className="size-4" />
              Сохранённые поиски
            </div>
            <div className="space-y-2">
              {savedSearches.map((search, index) => (
                <Button
                  key={`${search.name}-${index}`}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs hover:bg-muted"
                  onClick={() => loadSearch(search.params)}
                >
                  {search.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setSearchQuery('');
            setSelectedCity('all');
            setSelectedCategory('pc-components');
            setSelectedBrand('all');
            setSelectedSellerType('all');
            setSelectedCondition('all');
            setSelectedDateFilter('all');
            setSelectedSort('date_desc');
            setMinPrice('');
            setMaxPrice('');
            setWithDelivery(false);
          }}
        >
          Сбросить фильтры
        </Button>
      </div>
    );
  };

  const applyQuickSearch = (config: QuickSearchConfig) => {
    setSearchQuery(config.query);
    setSelectedCity(config.city ?? 'all');
    setMinPrice(config.minPrice ? String(config.minPrice) : '');
    setMaxPrice(config.maxPrice ? String(config.maxPrice) : '');
    setSelectedBrand(config.brand ?? 'all');
    setWithDelivery(Boolean(config.withDelivery));
    setTimeout(() => {
      handleSearch();
    }, 0);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setCurrentPage(1);
    
    // Add to search history
    if (searchQuery && !searchHistory.includes(searchQuery)) {
      setSearchHistory(prev => [searchQuery, ...prev].slice(0, 5));
    }
    
    try {
      // Пытаемся загрузить реальные данные от backend
      const backendUrl = 'http://localhost:3002';
      
      const requestBody = {
        query: searchQuery || '',
        marketplace: 'olx',
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        category: selectedCategory,
        location: selectedCity !== 'all' ? selectedCity : undefined,
        withDelivery: withDelivery, // 🚚 Фильтр доставки
      };
      
      console.log('[Frontend] Sending search request:', requestBody);
      
      const response = await fetch(`${backendUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          console.log(`[Frontend] Received ${data.results.length} listings from backend`);
          
          // Преобразуем backend данные в формат OLXListing
          const listings: OLXListing[] = data.results.map((item: any, index: number) => ({
            id: item.id || `olx-${index}`,
            title: item.title || 'Без названия',
            price: parseFloat(item.price) || 0,
            currency: 'zł',
            location: item.location || 'Польша',
            city: selectedCity !== 'all' ? selectedCity : 'all',
            condition: 'used' as const,
            description: item.description || '',
            image: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
            url: item.url || undefined, // 🔗 ПРЯМАЯ ССЫЛКА НА ОБЪЯВЛЕНИЕ!
            seller: {
              name: item.seller || 'Продавец',
              type: 'private' as const,
            },
            publishedAt: new Date().toISOString().split('T')[0],
            promoted: false,
            category: selectedCategory,
          }));
          
          console.log(`[Frontend] Processed ${listings.length} listings`);
          console.log(`[Frontend] Sample listing:`, listings[0]);
          
          // 🤖 Запускаем AI анализ для реальных данных
          analyzeAllOffers(listings);
          
          // 🎯 Сортируем по AI рейтингу (лучшие сверху)
          const sortedListings = [...listings].sort((a, b) => {
            const scoreA = aiRecommendations.get(a.id)?.score || 50;
            const scoreB = aiRecommendations.get(b.id)?.score || 50;
            return scoreB - scoreA; // По убыванию
          });
          
          setResults(sortedListings);
          
          const topOffers = sortedListings.filter((_, i) => i < 5); // Топ 5
          toast.success(`Найдено ${listings.length} объявлений с OLX.pl`, {
            description: `✨ ${topOffers.length} лучших предложений сверху | Средняя цена: ${calculateAveragePrice(listings)} zł`,
          });
          setIsSearching(false);
          return;
        } else {
          // Backend вернул 0 результатов - используем mock данные
          console.log('[OLX] Backend returned 0 results, using mock data');
          toast.info('OLX scraper вернул 0 результатов', {
            description: 'Показываю mock данные для демонстрации',
          });
        }
      }
    } catch (error) {
      console.error('Backend error:', error);
      toast.warning('Backend недоступен', {
        description: 'Показываю mock данные',
      });
    }
    
    // Fallback на mock данные
    console.log('[OLX] Using mock data fallback');
    const filtered = filterOLXListings({
      query: searchQuery,
      city: selectedCity,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      condition: selectedCondition,
      category: selectedCategory,
    });
    
    console.log('[OLX] Filtered mock results:', filtered.length);
    setResults(filtered);
    
    // 🤖 Запускаем AI анализ
    if (filtered.length > 0) {
      analyzeAllOffers(filtered);
      
      const topOffers = getTopOffers(filtered);
      const offersToAvoid = getOffersToAvoid(filtered);
      
      toast.info(`Найдено ${filtered.length} объявлений`, {
        description: `✨ ${topOffers.length} отличных предложений | ⚠️ ${offersToAvoid.length} лучше избегать`,
      });
    } else {
      toast.warning('Ничего не найдено в mock данных', {
        description: 'Попробуйте изменить параметры поиска',
      });
    }
    
    setIsSearching(false);
  };
  
  // 🤖 AI анализ всех предложений
  const analyzeAllOffers = (listings: OLXListing[]) => {
    const recommendations = new Map<string, AIRecommendation>();
    
    listings.forEach(listing => {
      const recommendation = analyzeOffer(listing, listings);
      recommendations.set(listing.id, recommendation);
    });
    
    setAIRecommendations(recommendations);
    console.log('[AI] Analyzed', recommendations.size, 'offers');
  };

  const handleOpenOnOLX = (listing?: OLXListing) => {
    // Если у объявления есть прямая ссылка - используем её
    if (listing?.url) {
      window.open(listing.url, '_blank');
      toast.success('Открываю объявление на OLX.pl', {
        description: listing.title,
      });
      return;
    }
    
    // Иначе строим URL поиска
    const url = buildOLXUrl({
      query: listing?.title || searchQuery || 'pc-components',
      city: selectedCity,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      condition: selectedCondition,
    });
    
    window.open(url, '_blank');
    toast.success('Открываю поиск на OLX.pl', {
      description: 'Результаты поиска',
    });
  };

  const applyPricePreset = (presetId: string) => {
    const preset = PRICE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setMinPrice(preset.min ? preset.min.toString() : '');
      setMaxPrice(preset.max ? preset.max.toString() : '');
    }
  };

  const toggleFavorite = (listingId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(listingId)) {
        newFavorites.delete(listingId);
        toast.info('Удалено из избранного');
      } else {
        newFavorites.add(listingId);
        toast.success('Добавлено в избранное');
      }
      // Сохраняем в localStorage
      localStorage.setItem('olx-favorites', JSON.stringify([...newFavorites]));
      return newFavorites;
    });
  };

  const saveSearch = () => {
    const searchName = searchQuery || 'Безымянный поиск';
    const searchParams = {
      query: searchQuery,
      city: selectedCity,
      category: selectedCategory,
      condition: selectedCondition,
      brand: selectedBrand,
      minPrice,
      maxPrice,
    };
    setSavedSearches(prev => {
      const updated = [...prev, { name: searchName, params: searchParams }];
      // Сохраняем в localStorage
      localStorage.setItem('olx-saved-searches', JSON.stringify(updated));
      return updated;
    });
    toast.success(`Поиск "${searchName}" сохранён`);
  };

  const loadSearch = (params: any) => {
    setSearchQuery(params.query || '');
    setSelectedCity(params.city || 'all');
    setSelectedCategory(params.category || 'pc-components');
    setSelectedCondition(params.condition || 'all');
    setSelectedBrand(params.brand || 'all');
    setMinPrice(params.minPrice || '');
    setMaxPrice(params.maxPrice || '');
    handleSearch();
  };

  // Пагинация
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = results.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate statistics
  const calculateAveragePrice = (listings: OLXListing[]) => {
    if (listings.length === 0) return 0;
    const sum = listings.reduce((acc, item) => acc + item.price, 0);
    return Math.round(sum / listings.length);
  };

  const calculatePriceStats = () => {
    if (results.length === 0) return null;
    const prices = results.map(r => r.price).sort((a, b) => a - b);
    return {
      min: prices[0],
      max: prices[prices.length - 1],
      avg: calculateAveragePrice(results),
      median: prices[Math.floor(prices.length / 2)],
      total: results.length,
    };
  };

  // Export to CSV
  const exportToCSV = () => {
    if (results.length === 0) {
      toast.error('Нет данных для экспорта');
      return;
    }

    const headers = ['Название', 'Цена', 'Валюта', 'Город', 'Состояние', 'Продавец', 'Дата'];
    const rows = results.map(r => [
      r.title,
      r.price,
      r.currency,
      r.location,
      r.condition === 'new' ? 'Новое' : 'Б/У',
      r.seller.name,
      r.publishedAt,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `olx-search-${Date.now()}.csv`;
    link.click();
    toast.success('Экспорт завершён');
  };

  // Toggle comparison
  const toggleComparison = (listingId: string) => {
    setComparisonList(prev => {
      const newList = new Set(prev);
      if (newList.has(listingId)) {
        newList.delete(listingId);
        toast.info('Удалено из сравнения');
      } else {
        if (newList.size >= 4) {
          toast.warning('Максимум 4 товара для сравнения');
          return prev;
        }
        newList.add(listingId);
        toast.success('Добавлено в сравнение');
      }
      return newList;
    });
  };

  // Copy share link
  const shareSearch = () => {
    const url = buildOLXUrl({
      query: searchQuery || 'pc-components',
      city: selectedCity,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      condition: selectedCondition,
    });
    
    navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована', { description: 'Поделитесь результатами поиска' });
  };
  
  // 👍 Лайк
  const handleLike = (listing: OLXListing) => {
    savePreference(listing, 'like');
    setUserPreferences(prev => {
      const newPrefs = new Map(prev);
      newPrefs.set(listing.id, 'like');
      return newPrefs;
    });

    toast.success('👍 Лайк!', {
      description: 'AI запомнит что вам нравится',
    });

    // Пересчитываем AI рекомендации с учётом нового лайка
    analyzeAllOffers(results);
  };

  // 👎 Дизлайк
  const handleDislike = (listing: OLXListing) => {
    savePreference(listing, 'dislike');
    setUserPreferences(prev => {
      const newPrefs = new Map(prev);
      newPrefs.set(listing.id, 'dislike');
      return newPrefs;
    });

    toast.error('👎 Дизлайк', {
      description: 'AI будет избегать похожих товаров',
    });

    // Пересчитываем AI рекомендации с учётом нового дизлайка
    analyzeAllOffers(results);
  };

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = results.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateAveragePrice = (listings: OLXListing[]) => {
    if (listings.length === 0) return 0;
    const sum = listings.reduce((acc, item) => acc + item.price, 0);
    return Math.round(sum / listings.length);
  };

  const calculatePriceStats = () => {
    if (results.length === 0) return null;
    const prices = results.map(r => r.price).sort((a, b) => a - b);
    return {
      min: prices[0],
      max: prices[prices.length - 1],
      avg: calculateAveragePrice(results),
      median: prices[Math.floor(prices.length / 2)],
      total: results.length,
    };
  };

  const topRecommendations = results.length > 0 ? getTopOffers(results) : [];
  const riskyRecommendations = results.length > 0 ? getOffersToAvoid(results) : [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
  {results.length > 0 && (
    <div className="px-4 pt-4 text-sm text-muted-foreground flex flex-wrap items-center gap-2">
      <span>Найдено: {results.length} объявлений</span>
      {selectedCity !== 'all' && (
        <Badge variant="secondary">
          {POLISH_CITIES.find(c => c.id === selectedCity)?.name}
        </Badge>
      )}
      {minPrice && <Badge variant="secondary">От {minPrice} zł</Badge>}
      {maxPrice && <Badge variant="secondary">До {maxPrice} zł</Badge>}
      {selectedCondition !== 'all' && (
        <Badge variant="secondary">
          {ITEM_CONDITIONS.find(c => c.id === selectedCondition)?.name}
        </Badge>
      )}
      {selectedBrand !== 'all' && (
        <Badge variant="secondary">
          {PC_BRANDS.find(b => b.id === selectedBrand)?.name}
        </Badge>
      )}
      {favorites.size > 0 && (
        <Badge variant="outline" className="text-red-500">
          <Heart className="size-3 mr-1 fill-red-500" />
          {favorites.size} избранных
        </Badge>
      )}
      {comparisonList.size > 0 && (
        <Badge 
          variant="outline" 
          className="text-blue-500 cursor-pointer hover:bg-blue-50"
          onClick={() => setShowComparison(true)}
        >
          <BarChart3 className="size-3 mr-1" />
          {comparisonList.size} в сравнении - Открыть
        </Badge>
      )}
    </div>
  )}

  {showStats && results.length > 0 && (
    <Card className="mx-4 mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Статистика цен</CardTitle>
      </CardHeader>
      <CardContent>
        {(() => {
          const stats = calculatePriceStats();
          if (!stats) return null;
          return (
            <div className="grid grid-cols-5 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Минимум</div>
                <div className="text-lg font-bold text-green-600">{stats.min} zł</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Максимум</div>
                <div className="text-lg font-bold text-red-600">{stats.max} zł</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Средняя</div>
                <div className="text-lg font-bold text-blue-600">{stats.avg} zł</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Медиана</div>
                <div className="text-lg font-bold text-purple-600">{stats.median} zł</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Всего объявлений</div>
                <div className="text-lg font-bold">{stats.total}</div>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  )}

  {results.length === 0 && (
    <div>
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">Как получить максимум от поиска?</CardTitle>
                    <CardDescription>Пара советов, чтобы быстрее найти нужную комплектующую.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">1. Используйте точные ключевые слова</h4>
                      <p>Например: `RTX 3060 Ti`, `Ryzen 5 5600X`, `NVMe 1TB`. Чем точнее запрос, тем меньше мусора.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">2. Ограничьте бюджет</h4>
                      <p>В полях **От/До** задайте комфортный диапазон цены, чтобы фильтровать завышенные предложения.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">3. Включите доставку OLX</h4>
                      <p>Отметьте переключатель «С доставкой» — это безопаснее и удобно для удалённых городов.</p>
                    </div>
                  </CardContent>
                </Card>

            </div>
             )}
             {isSearching && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center max-w-md mx-auto">
                  {/* 🎨 Крутой анимированный индикатор */}
                  <div className="relative size-32 mx-auto mb-6">
                    {/* Внешнее кольцо */}
                    <div className="absolute inset-0 border-4 border-orange-200 dark:border-orange-900 rounded-full" />
                    {/* Вращающееся кольцо */}
                    <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" />
                    {/* Внутреннее пульсирующее кольцо */}
                    <div className="absolute inset-4 border-4 border-transparent border-t-orange-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                    {/* Иконка */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Search className="size-12 text-orange-500 animate-pulse" />
                    </div>
                  </div>
                  
                  {/* Текст с анимацией */}
                  <div className="space-y-3">
                    <p className="text-lg font-semibold text-orange-600 dark:text-orange-400 animate-pulse">
                      🔍 Ищем лучшие предложения на OLX...
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="size-1.5 bg-orange-500 rounded-full animate-bounce" />
                      <div className="size-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="size-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Парсим реальные объявления с OLX.pl
                    </p>
                    <p className="text-xs text-muted-foreground opacity-70">
                      Это может занять 30-60 секунд...
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!isSearching && (
              <>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                {paginatedResults.map((listing, index) => (
                  <Card key={`${listing.id}-${index}`} className="hover:border-primary cursor-pointer transition-all group hover:shadow-lg">
                    <CardHeader className="p-0">
                      <div className="relative">
                        <img
                          src={listing.image}
                          alt={listing.title}
                          className="w-full h-40 object-cover rounded-t-lg"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80';
                          }}
                        />
                        {listing.promoted && (
                          <Badge className="absolute top-2 left-2 bg-orange-500">
                            <TrendingUp className="size-3 mr-1" />
                            Промо
                          </Badge>
                        )}
                        <Badge className="absolute top-2 right-2 bg-background/90">
                          {listing.condition === 'new' ? 'Новое' : 'Б/У'}
                        </Badge>
                        
                        {/* 🤖 AI Рекомендация */}
                        {aiRecommendations.has(listing.id) && (() => {
                          const rec = aiRecommendations.get(listing.id)!;
                          let badgeClass = '';
                          let Icon = Zap;
                          let label = '';
                          
                          if (rec.category === 'excellent') {
                            badgeClass = 'bg-green-500 text-white';
                            Icon = Award;
                            label = `${rec.score} ⭐`;
                          } else if (rec.category === 'good') {
                            badgeClass = 'bg-blue-500 text-white';
                            Icon = ThumbsUp;
                            label = `${rec.score} 👍`;
                          } else if (rec.category === 'fair') {
                            badgeClass = 'bg-yellow-500 text-white';
                            Icon = Zap;
                            label = `${rec.score}`;
                          } else if (rec.category === 'poor') {
                            badgeClass = 'bg-orange-500 text-white';
                            Icon = AlertCircle;
                            label = `${rec.score} ⚠️`;
                          } else {
                            badgeClass = 'bg-red-500 text-white';
                            Icon = AlertTriangle;
                            label = `${rec.score} 🚫`;
                          }
                          
                          return (
                            <Badge className={`absolute bottom-2 left-2 ${badgeClass}`}>
                              <Icon className="size-3 mr-1" />
                              AI: {label}
                            </Badge>
                          );
                        })()}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3">
                      <CardTitle className="text-xs line-clamp-2 mb-1 font-semibold leading-tight">
                        {listing.title}
                      </CardTitle>

                      <div className="mb-2">
                        <div className="text-lg font-bold text-green-600">
                          {listing.price} {listing.currency}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="size-2.5" />
                          {listing.location}
                        </div>
                      </div>

                      {/* Лайк/Дизлайк кнопки */}
                      <div className="flex gap-1 mb-2">
                        <Button
                          size="sm"
                          variant={userPreferences.get(listing.id) === 'like' ? 'default' : 'outline'}
                          className={`flex-1 h-7 ${userPreferences.get(listing.id) === 'like' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(listing);
                          }}
                        >
                          <ThumbsUp className={`size-3 ${userPreferences.get(listing.id) === 'like' ? 'fill-white' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant={userPreferences.get(listing.id) === 'dislike' ? 'default' : 'outline'}
                          className={`flex-1 h-7 ${userPreferences.get(listing.id) === 'dislike' ? 'bg-red-500 hover:bg-red-600' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDislike(listing);
                          }}
                        >
                          <ThumbsDown className={`size-3 ${userPreferences.get(listing.id) === 'dislike' ? 'fill-white' : ''}`} />
                        </Button>
                      </div>

                      {/* Остальные кнопки */}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={favorites.has(listing.id) ? 'default' : 'outline'}
                          className="h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(listing.id);
                          }}
                        >
                          <Heart className={`size-3 ${favorites.has(listing.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant={comparisonList.has(listing.id) ? 'default' : 'outline'}
                          className="h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComparison(listing.id);
                          }}
                        >
                          <BarChart3 className="size-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedListing(listing);
                          }}
                        >
                          <Eye className="size-3" />
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOnOLX(listing);
                          }}
                        >
                          <ExternalLink className="size-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={currentPage === page ? 'default' : 'outline'}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Listing Details Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 overflow-auto" onClick={() => setSelectedListing(null)}>
          <div className="w-full max-w-3xl my-8">
          <Card className="w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => setSelectedListing(null)}
              >
                <X className="size-4" />
              </Button>
              <img
                src={selectedListing.image}
                alt={selectedListing.title}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <CardTitle>{selectedListing.title}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={selectedListing.condition === 'new' ? 'default' : 'secondary'}>
                    {selectedListing.condition === 'new' ? 'Новое' : 'Б/У'}
                  </Badge>
                  {selectedListing.promoted && (
                    <Badge variant="outline" className="text-orange-500">
                      <TrendingUp className="size-3 mr-1" />
                      Промо
                    </Badge>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Цена</h3>
                  <div className="text-3xl font-bold text-green-600">
                    {selectedListing.price} {selectedListing.currency}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Описание</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedListing.description || 'Описание отсутствует'}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="size-4" />
                      Местоположение
                    </h3>
                    <p className="text-sm">{selectedListing.location}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Clock className="size-4" />
                      Дата публикации
                    </h3>
                    <p className="text-sm">
                      {new Date(selectedListing.publishedAt).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Продавец</h3>
                  <div className="flex items-center gap-2">
                    {selectedListing.seller.type === 'business' ? (
                      <span className="text-sm">🏢 {selectedListing.seller.name}</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{selectedListing.seller.name}</span>
                        {selectedListing.seller.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{selectedListing.seller.rating}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* 🤖 AI Анализ */}
                {aiRecommendations.has(selectedListing.id) && (() => {
                  const rec = aiRecommendations.get(selectedListing.id)!;
                  let bgColor = '';
                  let borderColor = '';
                  
                  if (rec.category === 'excellent') {
                    bgColor = 'bg-green-50';
                    borderColor = 'border-green-500';
                  } else if (rec.category === 'good') {
                    bgColor = 'bg-blue-50';
                    borderColor = 'border-blue-500';
                  } else if (rec.category === 'fair') {
                    bgColor = 'bg-yellow-50';
                    borderColor = 'border-yellow-500';
                  } else if (rec.category === 'poor') {
                    bgColor = 'bg-orange-50';
                    borderColor = 'border-orange-500';
                  } else {
                    bgColor = 'bg-red-50';
                    borderColor = 'border-red-500';
                  }
                  
                  return (
                    <div className={`${bgColor} border-2 ${borderColor} rounded-lg p-4`}>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Zap className="size-5" />
                        AI Анализ Предложения
                      </h3>
                      
                      {/* Score */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Оценка</span>
                          <span className="text-lg font-bold">{rec.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              rec.score >= 80 ? 'bg-green-500' :
                              rec.score >= 65 ? 'bg-blue-500' :
                              rec.score >= 45 ? 'bg-yellow-500' :
                              rec.score >= 30 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${rec.score}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Main Reason */}
                      {rec.reasons.length > 0 && (
                        <div className="mb-3 p-2 bg-white/50 rounded">
                          <p className="text-sm font-medium">{rec.reasons[0]}</p>
                        </div>
                      )}
                      
                      {/* Pros */}
                      {rec.pros.length > 0 && (
                        <div className="mb-2">
                          <h4 className="text-xs font-semibold mb-1 text-green-700">✅ Преимущества:</h4>
                          <ul className="text-xs space-y-1">
                            {rec.pros.map((pro, i) => (
                              <li key={i}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Cons */}
                      {rec.cons.length > 0 && (
                        <div className="mb-2">
                          <h4 className="text-xs font-semibold mb-1 text-red-700">❌ Недостатки:</h4>
                          <ul className="text-xs space-y-1">
                            {rec.cons.map((con, i) => (
                              <li key={i}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Price Analysis */}
                      <div className="mt-3 p-2 bg-white/50 rounded text-xs">
                        <strong>Анализ цены:</strong> {rec.priceAnalysis.priceLevel} ({rec.priceAnalysis.comparedToAverage.toFixed(0)}% от рынка)
                      </div>
                    </div>
                  );
                })()}

                <Separator />

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      toggleFavorite(selectedListing.id);
                    }}
                    variant={favorites.has(selectedListing.id) ? 'default' : 'outline'}
                  >
                    <Heart className={`size-4 mr-2 ${favorites.has(selectedListing.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    {favorites.has(selectedListing.id) ? 'В избранном' : 'В избранное'}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleOpenOnOLX(selectedListing)}
                  >
                    <ExternalLink className="size-4 mr-2" />
                    Открыть на OLX
                  </Button>
                </div>
              </CardContent>
          </Card>
          </div>
        </div>
      )}

      {/* Comparison Table Modal */}
      {showComparison && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 overflow-auto" onClick={() => setShowComparison(false)}>
          <Card className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>📊 Сравнение Товаров ({comparisonList.size})</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowComparison(false)}>
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {comparisonList.size === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Добавьте товары для сравнения, нажав на кнопку 📊 на карточках
                </p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted text-left sticky left-0">Характеристика</th>
                      {[...comparisonList].slice(0, 4).map(id => {
                        const listing = results.find(r => r.id === id);
                        return (
                          <th key={id} className="border p-2 min-w-[200px]">
                            <div className="flex flex-col gap-2">
                              <img src={listing?.image} alt={listing?.title} className="w-full h-32 object-cover rounded" />
                              <p className="text-sm font-medium line-clamp-2">{listing?.title}</p>
                              <Button size="sm" variant="ghost" onClick={() => toggleComparison(id)}>
                                <X className="size-3 mr-1" /> Удалить
                              </Button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 font-medium bg-muted sticky left-0">Цена</td>
                      {[...comparisonList].slice(0, 4).map(id => {
                        const listing = results.find(r => r.id === id);
                        return (
                          <td key={id} className="border p-2 text-center">
                            <span className="text-lg font-bold text-green-600">
                              {listing?.price} {listing?.currency}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-muted sticky left-0">Местоположение</td>
                      {[...comparisonList].slice(0, 4).map(id => {
                        const listing = results.find(r => r.id === id);
                        return <td key={id} className="border p-2 text-center">{listing?.location}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-muted sticky left-0">Состояние</td>
                      {[...comparisonList].slice(0, 4).map(id => {
                        const listing = results.find(r => r.id === id);
                        return (
                          <td key={id} className="border p-2 text-center">
                            <Badge variant={listing?.condition === 'new' ? 'default' : 'secondary'}>
                              {listing?.condition === 'new' ? 'Новое' : 'Б/У'}
                            </Badge>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-muted sticky left-0">AI Рейтинг</td>
                      {[...comparisonList].slice(0, 4).map(id => {
                        const rec = aiRecommendations.get(id);
                        return (
                          <td key={id} className="border p-2 text-center">
                            {rec ? (
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-2xl">{rec.score >= 80 ? '⭐' : rec.score >= 60 ? '👍' : '👌'}</span>
                                <span className="font-bold">{rec.score}%</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-muted sticky left-0">Продавец</td>
                      {[...comparisonList].slice(0, 4).map(id => {
                        const listing = results.find(r => r.id === id);
                        return (
                          <td key={id} className="border p-2 text-center">
                            {listing?.seller?.name || 'Не указан'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-muted sticky left-0">Действия</td>
                      {[...comparisonList].slice(0, 4).map(id => {
                        const listing = results.find(r => r.id === id);
                        return (
                          <td key={id} className="border p-2">
                            <div className="flex flex-col gap-2">
                              <Button size="sm" onClick={() => setSelectedListing(listing!)}>
                                <Eye className="size-3 mr-1" /> Подробнее
                              </Button>
                              <Button size="sm" onClick={() => handleOpenOnOLX(listing)}>
                                <ExternalLink className="size-3 mr-1" /> OLX
                              </Button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
