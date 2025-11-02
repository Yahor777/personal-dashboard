import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import {
  Search,
  MapPin,
  Clock,
  Heart,
  Star,
  SlidersHorizontal,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Loader2,
  Info,
  Truck,
  User,
  Building2,
  Phone,
  ArrowUpRight,
  X,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useDashboardStore } from "../../store/dashboardStore";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import type { AISettings } from "../../lib/ai-settings";
import { getAISettings, sendAIMessage } from "../../lib/ai-settings";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import type { Language } from "../../types";

interface ListingAttribute {
  label: string;
  value: string;
}

interface ListingResult {
  id: string;
  title: string;
  price: string;
  currency?: string;
  location?: string;
  publishedAt?: string;
  url: string;
  image?: string;
  images?: string[];
  description?: string;
  deliveryOptions?: string[];
  deliveryAvailable?: boolean;
  sellerName?: string | null;
  sellerProfileUrl?: string | null;
  sellerPhone?: string | null;
  sellerType?: string | null;
  categoryPath?: string[];
  attributes?: ListingAttribute[];
  numericPrice?: number;
}

type ListingSummaryDecision = "buy" | "consider" | "avoid";

interface ListingSummary {
  summary: string;
  decision: ListingSummaryDecision;
  reason: string;
  betterDealUrl: string;
  raw?: string;
}

const placeholderImage =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80";

const DECISION_META: Record<
  ListingSummaryDecision,
  { label: string; className: string }
> = {
  buy: {
    label: "Можно брать",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/40",
  },
  consider: {
    label: "Нужно подумать",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/40",
  },
  avoid: {
    label: "Лучше воздержаться",
    className: "bg-red-500/10 text-red-600 border-red-500/40",
  },
};

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

interface CategoryNode {
  value: string;
  label: string;
  children?: CategoryNode[];
}

const OLX_CATEGORY_TREE: CategoryNode[] = [
  {
    value: "elektronika",
    label: "Электроника",
    children: [
      {
        value: "elektronika/komputery",
        label: "Компьютеры",
        children: [
          {
            value: "elektronika/komputery/podzespoly-i-czesci",
            label: "Подсистемы и части",
            children: [
              { value: "elektronika/komputery/podzespoly-i-czesci/karty-graficzne", label: "Видеокарты" },
              { value: "elektronika/komputery/podzespoly-i-czesci/procesory", label: "Процессоры" },
              { value: "elektronika/komputery/podzespoly-i-czesci/pamieci-ram", label: "Память RAM" },
              { value: "elektronika/komputery/podzespoly-i-czesci/zasilacze", label: "Блоки питания" },
              {
                value: "elektronika/komputery/podzespoly-i-czesci/chlodzenie-do-komputerow",
                label: "Охлаждение",
              },
              {
                value: "elektronika/komputery/podzespoly-i-czesci/plyty-glowne",
                label: "Материнские платы",
              },
              {
                value: "elektronika/komputery/podzespoly-i-czesci/obudowy",
                label: "Корпуса",
              },
            ],
          },
          {
            value: "elektronika/komputery/komputery-stacjonarne",
            label: "Стационарные ПК",
          },
          { value: "elektronika/komputery/laptopy", label: "Ноутбуки" },
          { value: "elektronika/komputery/tablety", label: "Планшеты" },
          {
            value: "elektronika/komputery/akcesoria-komputerowe",
            label: "Компьютерные аксессуары",
          },
          {
            value: "elektronika/komputery/urzadzenia-sieciowe",
            label: "Сетевое оборудование",
          },
          {
            value: "elektronika/komputery/drukarki-i-skanery",
            label: "Принтеры и сканеры",
          },
        ],
      },
      { value: "elektronika/fotografia", label: "Фото и видео" },
      { value: "elektronika/konsole-i-gry", label: "Игры и приставки" },
      { value: "elektronika/telefony", label: "Телефоны" },
      { value: "elektronika/sprzet-audio", label: "Аудио" },
      { value: "elektronika/pozostala-elektronika", label: "Прочая электроника" },
    ],
  },
  { value: "motoryzacja", label: "Мототехника" },
  { value: "dom", label: "Дом и огород" },
  { value: "rolnictwo", label: "Сельское хозяйство" },
  { value: "sport-hobby", label: "Спорт и хобби" },
  { value: "uslugi", label: "Услуги" },
  { value: "muzyka-edukacja", label: "Музыка и образование" },
];

const CATEGORY_PATH_TO_ID: Record<string, string> = {
  "elektronika/komputery/podzespoly-i-czesci": "1845",
  "elektronika/komputery/podzespoly-i-czesci/karty-graficzne": "2184",
  "elektronika/komputery/podzespoly-i-czesci/procesory": "2189",
  "elektronika/komputery/podzespoly-i-czesci/pamieci-ram": "2187",
  "elektronika/komputery/podzespoly-i-czesci/zasilacze": "2190",
  "elektronika/komputery/podzespoly-i-czesci/chlodzenie-do-komputerow": "3096",
  "elektronika/komputery/podzespoly-i-czesci/plyty-glowne": "2188",
  "elektronika/komputery/podzespoly-i-czesci/obudowy": "2186",
  "elektronika/komputery/komputery-stacjonarne": "1197",
  "elektronika/komputery/laptopy": "1199",
  "elektronika/komputery": "443",
};

const OLX_SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "newest", label: "Сначала новые" },
  { value: "price_asc", label: "Цена: по возрастанию" },
  { value: "price_desc", label: "Цена: по убыванию" },
  { value: "relevance", label: "По релевантности" },
];

const CONDITION_DICTIONARY: Record<Language, Record<string, string>> = {
  pl: {
    all: "Wszystkie stany",
    new: "Nowe",
    used: "Używane",
    damaged: "Uszkodzone",
  },
  ru: {
    all: "Любое состояние",
    new: "Новое (Nowe)",
    used: "Б/у (Używane)",
    damaged: "Повреждено (Uszkodzone)",
  },
  en: {
    all: "Any condition",
    new: "New (Nowe)",
    used: "Used (Używane)",
    damaged: "Damaged (Uszkodzone)",
  },
};

const CONDITION_KEYS = ["all", "new", "used", "damaged"] as const;

const OLX_SELLER_TYPES: Array<{ value: string; label: string }> = [
  { value: "all", label: "Любой продавец" },
  { value: "private", label: "Частное лицо" },
  { value: "company", label: "Компания" },
];

const OLX_DELIVERY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "olx_delivery", label: "OLX доставка" },
  { value: "courier", label: "Курьер" },
  { value: "parcel", label: "Почтомат/посылка" },
  { value: "selfpickup", label: "Самовывоз" },
];

type AttributeFilterKey =
  | "operatingSystem"
  | "cpuSeries"
  | "physicalCores"
  | "ramType"
  | "ramSize"
  | "diskType"
  | "diskSize"
  | "gpuModel";

type AttributeFilterState = Record<AttributeFilterKey, string>;

const ATTRIBUTE_FILTER_META: Record<AttributeFilterKey, { label: string; attributeLabels: string[] }> = {
  operatingSystem: {
    label: "Система",
    attributeLabels: ["System operacyjny", "Операционная система"],
  },
  cpuSeries: {
    label: "Серия процессора",
    attributeLabels: ["Seria procesora", "Серия процессора"],
  },
  physicalCores: {
    label: "Физические ядра",
    attributeLabels: ["Rdzenie fizyczne", "Количество ядер"],
  },
  ramType: {
    label: "Тип памяти RAM",
    attributeLabels: ["Typ pamięci RAM", "Rodzaj pamięci RAM", "Тип памяти"],
  },
  ramSize: {
    label: "Объем RAM",
    attributeLabels: ["Wielkość pamięci RAM", "Pamięć RAM", "Объем памяти RAM"],
  },
  diskType: {
    label: "Тип диска",
    attributeLabels: ["Typ dysku", "Rodzaj dysku", "Тип накопителя"],
  },
  diskSize: {
    label: "Объем диска",
    attributeLabels: ["Wielkość dysku", "Pojemność dysku", "Объем накопителя"],
  },
  gpuModel: {
    label: "Видеокарта",
    attributeLabels: ["Karta graficzna", "Model karty graficznej", "Видеокарта"],
  },
};

const DEFAULT_ATTRIBUTE_FILTER_STATE: AttributeFilterState = {
  operatingSystem: "all",
  cpuSeries: "all",
  physicalCores: "all",
  ramType: "all",
  ramSize: "all",
  diskType: "all",
  diskSize: "all",
  gpuModel: "all",
};

const DEFAULT_SORT = "newest";
type CheckboxState = boolean | "indeterminate";

const findCategoryNode = (value: string, nodes: CategoryNode[] = OLX_CATEGORY_TREE): CategoryNode | undefined => {
  for (const node of nodes) {
    if (node.value === value) {
      return node;
    }
    if (node.children) {
      const match = findCategoryNode(value, node.children);
      if (match) {
        return match;
      }
    }
  }
  return undefined;
};

const resolveCategoryParam = (value: string | undefined): string | undefined => {
  if (!value || value === "all") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  return CATEGORY_PATH_TO_ID[trimmed] ?? trimmed;
};

const sanitizeImageUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.startsWith("http")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return undefined;
};

const formatListingPrice = (price: unknown, currency?: string): string => {
  if (price === null || price === undefined) {
    return "Цена уточняется";
  }

  const parseNumeric = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const cleaned = value.replace(/[^0-9,\.]/g, "").replace(/,(\d{2})$/, ".$1");
      const numeric = Number.parseFloat(cleaned.replace(/\s+/g, ""));
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
    return null;
  };

  const numeric = parseNumeric(price);
  if (!numeric || numeric <= 0) {
    if (typeof price === "string" && price.trim()) {
      return price.trim();
    }
    return "Цена уточняется";
  }

  const normalizedCurrency = (() => {
    const raw = (currency ?? "").toString().trim().toUpperCase();
    if (!raw || raw === "ZŁ") {
      return "PLN";
    }
    if (["PLN", "EUR", "USD", "GBP"].includes(raw)) {
      return raw;
    }
    return "PLN";
  })();

  try {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: normalizedCurrency,
    }).format(numeric);
  } catch (_) {
    return `${numeric.toLocaleString("pl-PL")} ${currency ?? ""}`.trim();
  }
};

export function OLXSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ListingResult[]>([]);
  const [rawResults, setRawResults] = useState<ListingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const favoriteListings = useDashboardStore((state) => state.favoriteListings);
  const toggleFavoriteListing = useDashboardStore((state) => state.toggleFavoriteListing);
  const addSavedSearch = useDashboardStore((state) => state.addSavedSearch);
  const removeSavedSearch = useDashboardStore((state) => state.removeSavedSearch);
  const savedSearches = useDashboardStore((state) => state.savedSearches);
  const currentUser = useDashboardStore((state) => state.currentUser);
  const listingFeedback = useDashboardStore((state) => state.listingFeedback);
  const setListingFeedback = useDashboardStore((state) => state.setListingFeedback);
  const preferences = useDashboardStore((state) => state.preferences);
  const language = (preferences?.language ?? "ru") as Language;
  const [aiSettings, setAISettingsState] = useState<AISettings | null>(() =>
    typeof window !== "undefined" ? getAISettings() : null
  );
  const [summaries, setSummaries] = useState<Record<string, ListingSummary>>({});
  const [summariesLoading, setSummariesLoading] = useState<Record<string, boolean>>({});
  const [selectedListing, setSelectedListing] = useState<ListingResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [primaryCategory, setPrimaryCategory] = useState<string>("all");
  const [secondaryCategory, setSecondaryCategory] = useState<string>("all");
  const [tertiaryCategory, setTertiaryCategory] = useState<string>("all");
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategoryId, setCustomCategoryId] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT);
  const [condition, setCondition] = useState<string>("all");
  const [sellerType, setSellerType] = useState<string>("all");
  const [withDelivery, setWithDelivery] = useState(false);
  const [selectedDeliveryOptions, setSelectedDeliveryOptions] = useState<string[]>([]);
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [attributeFilters, setAttributeFilters] = useState<AttributeFilterState>(
    DEFAULT_ATTRIBUTE_FILTER_STATE,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const conditionOptions = useMemo(() => {
    const dictionary = CONDITION_DICTIONARY[language] ?? CONDITION_DICTIONARY.ru;
    return CONDITION_KEYS.map((key) => ({
      value: key,
      label: dictionary[key] ?? key,
    }));
  }, [language]);

  const favoriteIds = useMemo(() => new Set(favoriteListings.map((item) => item.id)), [favoriteListings]);

  const sortedSavedSearches = useMemo(() => {
    return [...savedSearches].sort((a, b) => {
      const aTime = Date.parse(a.createdAt ?? "");
      const bTime = Date.parse(b.createdAt ?? "");
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
        return 0;
      }
      if (Number.isNaN(aTime)) {
        return 1;
      }
      if (Number.isNaN(bTime)) {
        return -1;
      }
      return bTime - aTime;
    });
  }, [savedSearches]);

  const sortedFavorites = useMemo(() => {
    return [...favoriteListings].sort((a, b) => {
      const aTime = Date.parse(a.createdAt ?? "");
      const bTime = Date.parse(b.createdAt ?? "");
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
        return 0;
      }
      if (Number.isNaN(aTime)) {
        return 1;
      }
      if (Number.isNaN(bTime)) {
        return -1;
      }
      return bTime - aTime;
    });
  }, [favoriteListings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const refresh = () => {
      setAISettingsState(getAISettings());
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "ai-settings") {
        refresh();
      }
    };

    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (useCustomCategory) {
      const trimmed = customCategoryId.trim();
      setCategory(trimmed.length ? trimmed : "all");
      return;
    }

    const resolvedCategory =
      tertiaryCategory !== "all"
        ? tertiaryCategory
        : secondaryCategory !== "all"
        ? secondaryCategory
        : primaryCategory;

    setCategory(resolvedCategory);
  }, [
    customCategoryId,
    primaryCategory,
    secondaryCategory,
    tertiaryCategory,
    useCustomCategory,
  ]);

  const aiReady = useMemo(() => {
    if (!aiSettings) {
      return false;
    }
    if (aiSettings.provider === "openrouter") {
      return Boolean(aiSettings.openRouterApiKey && aiSettings.selectedModel);
    }
    return Boolean(aiSettings.customApiKey && aiSettings.customApiUrl && aiSettings.selectedModel);
  }, [aiSettings]);

  const canUseAI = Boolean(currentUser && aiReady);

  const activeFiltersCount = useMemo(() => {
    const locationActive = Boolean(locationFilter.trim());
    const minActive = Boolean(minPrice.trim());
    const maxActive = Boolean(maxPrice.trim());
    const sortActive = sortBy !== DEFAULT_SORT;
    const conditionActive = condition !== "all";
    const sellerActive = sellerType !== "all";
    const deliverySwitchActive = withDelivery;
    const deliveryOptionsActive = selectedDeliveryOptions.length > 0;
    const customCategoryActive = useCustomCategory && Boolean(customCategoryId.trim());
    const categoryActive = !useCustomCategory && category !== "all";
    const onlyPhotosActive = onlyWithImages;
    const attributeActiveCount = Object.values(attributeFilters).reduce(
      (accumulator, value) => (value !== "all" ? accumulator + 1 : accumulator),
      0,
    );

    let total = 0;
    if (locationActive) total += 1;
    if (minActive) total += 1;
    if (maxActive) total += 1;
    if (sortActive) total += 1;
    if (conditionActive) total += 1;
    if (sellerActive) total += 1;
    if (deliverySwitchActive) total += 1;
    if (deliveryOptionsActive) total += selectedDeliveryOptions.length;
    if (onlyPhotosActive) total += 1;
    if (categoryActive || customCategoryActive) total += 1;
    total += attributeActiveCount;
    return total;
  }, [
    category,
    customCategoryId,
    attributeFilters,
    locationFilter,
    minPrice,
    maxPrice,
    sortBy,
    condition,
    sellerType,
    withDelivery,
    selectedDeliveryOptions,
    onlyWithImages,
    useCustomCategory,
  ]);

  const resetFilters = () => {
    setCategory("all");
    setPrimaryCategory("all");
    setSecondaryCategory("all");
    setTertiaryCategory("all");
    setUseCustomCategory(false);
    setCustomCategoryId("");
    setLocationFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy(DEFAULT_SORT);
    setCondition("all");
    setSellerType("all");
    setWithDelivery(false);
    setSelectedDeliveryOptions([]);
    setOnlyWithImages(false);
    setAttributeFilters(DEFAULT_ATTRIBUTE_FILTER_STATE);
  };

  const primarySelectOptions = useMemo(
    () => [
      { value: "all", label: "Все категории" },
      ...OLX_CATEGORY_TREE.map((node) => ({ value: node.value, label: node.label })),
    ],
    [],
  );

  const secondarySelectOptions = useMemo(() => {
    if (primaryCategory === "all") {
      return [{ value: "all", label: "Все" }];
    }
    const primaryNode = findCategoryNode(primaryCategory);
    const children = primaryNode?.children ?? [];
    return [{ value: "all", label: "Все" }, ...children.map((node) => ({ value: node.value, label: node.label }))];
  }, [primaryCategory]);

  const tertiarySelectOptions = useMemo(() => {
    if (secondaryCategory === "all") {
      return [{ value: "all", label: "Все" }];
    }
    const secondaryNode = findCategoryNode(secondaryCategory);
    const children = secondaryNode?.children ?? [];
    return [{ value: "all", label: "Все" }, ...children.map((node) => ({ value: node.value, label: node.label }))];
  }, [secondaryCategory]);

  const attributeValueMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    rawResults.forEach((listing) => {
      if (!listing.attributes) {
        return;
      }
      listing.attributes.forEach((attribute) => {
        const label = attribute.label?.trim();
        const value = attribute.value?.trim();
        if (!label || !value) {
          return;
        }
        const normalizedLabel = label.toLowerCase();
        if (!map.has(normalizedLabel)) {
          map.set(normalizedLabel, new Set());
        }
        map.get(normalizedLabel)!.add(value);
      });
    });
    return map;
  }, [rawResults]);

  const attributeOptions = useMemo(() => {
    const entries = {} as Record<AttributeFilterKey, string[]>;
    (Object.keys(ATTRIBUTE_FILTER_META) as AttributeFilterKey[]).forEach((key) => {
      const normalizedLabels = ATTRIBUTE_FILTER_META[key].attributeLabels.map((label) => label.toLowerCase());
      const valuesSet = new Set<string>();
      normalizedLabels.forEach((label) => {
        const values = attributeValueMap.get(label);
        if (values) {
          values.forEach((entry) => valuesSet.add(entry));
        }
      });
      entries[key] = Array.from(valuesSet).sort((a, b) =>
        a.localeCompare(b, "pl", { sensitivity: "base" }),
      );
    });
    return entries;
  }, [attributeValueMap]);

  const filteredResults = useMemo(() => {
    if (!rawResults.length) {
      return rawResults;
    }

    const selectedAttributeKeys = Object.keys(attributeFilters) as AttributeFilterKey[];

    const filtered = rawResults.filter((listing) => {
      if (withDelivery && !listing.deliveryAvailable) {
        return false;
      }

      if (selectedDeliveryOptions.length) {
        const listingDelivery = (listing.deliveryOptions ?? []).map((option) => option.toLowerCase());
        if (listingDelivery.length === 0) {
          return false;
        }

        const deliveryMatches = selectedDeliveryOptions.every((option) => {
          const normalizedOption = option.toLowerCase();
          return listingDelivery.some((entry) => {
            if (normalizedOption.includes("olx")) {
              return entry.includes("olx");
            }
            if (normalizedOption.includes("courier")) {
              return entry.includes("kurier") || entry.includes("courier") || entry.includes("kurj");
            }
            if (normalizedOption.includes("parcel")) {
              return entry.includes("pacz") || entry.includes("parcel") || entry.includes("paczk");
            }
            if (normalizedOption.includes("selfpickup")) {
              return entry.includes("odbiór") || entry.includes("osobisty") || entry.includes("sam");
            }
            return entry.includes(normalizedOption);
          });
        });

        if (!deliveryMatches) {
          return false;
        }
      }

      if (onlyWithImages) {
        const hasImage = Boolean(
          (listing.images && listing.images.some((src) => typeof src === "string" && src.length > 10)) ||
            (listing.image && listing.image.length > 10),
        );
        if (!hasImage) {
          return false;
        }
      }

      const attributes = listing.attributes ?? [];
      if (!attributes.length && selectedAttributeKeys.some((key) => attributeFilters[key] !== "all")) {
        return false;
      }

      const attributeMatch = selectedAttributeKeys.every((key) => {
        const expected = attributeFilters[key];
        if (expected === "all") {
          return true;
        }
        const normalizedExpected = expected.trim().toLowerCase();
        const normalizedLabels = ATTRIBUTE_FILTER_META[key].attributeLabels.map((label) => label.trim().toLowerCase());
        return attributes.some(({ label, value }) => {
          if (!label || !value) {
            return false;
          }
          const normalizedLabel = label.trim().toLowerCase();
          if (!normalizedLabels.includes(normalizedLabel)) {
            return false;
          }
          const normalizedValue = value.trim().toLowerCase();
          return (
            normalizedValue === normalizedExpected ||
            normalizedValue.includes(normalizedExpected) ||
            normalizedExpected.includes(normalizedValue)
          );
        });
      });

      if (!attributeMatch) {
        return false;
      }

      return true;
    });

    const sorted = [...filtered];

    const getNumericPrice = (listing: ListingResult): number | null =>
      typeof listing.numericPrice === "number" && Number.isFinite(listing.numericPrice)
        ? listing.numericPrice
        : null;

    const getTimestamp = (listing: ListingResult): number =>
      listing.publishedAt ? Date.parse(listing.publishedAt) || 0 : 0;

    switch (sortBy) {
      case "price_asc":
        sorted.sort((a, b) => {
          const priceA = getNumericPrice(a);
          const priceB = getNumericPrice(b);
          if (priceA === null && priceB === null) return 0;
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          return priceA - priceB;
        });
        break;
      case "price_desc":
        sorted.sort((a, b) => {
          const priceA = getNumericPrice(a);
          const priceB = getNumericPrice(b);
          if (priceA === null && priceB === null) return 0;
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          return priceB - priceA;
        });
        break;
      case "oldest":
        sorted.sort((a, b) => getTimestamp(a) - getTimestamp(b));
        break;
      case "newest":
        sorted.sort((a, b) => getTimestamp(b) - getTimestamp(a));
        break;
      default:
        break;
    }

    return sorted;
  }, [
    attributeFilters,
    onlyWithImages,
    rawResults,
    selectedDeliveryOptions,
    sortBy,
    withDelivery,
  ]);

  useEffect(() => {
    setResults(filteredResults);
  }, [filteredResults]);

  const handleDeliveryChange = (option: string, checked: boolean) => {
    setSelectedDeliveryOptions((prev) => {
      const exists = prev.includes(option);
      if (checked && !exists) {
        return [...prev, option];
      }
      if (!checked && exists) {
        return prev.filter((item) => item !== option);
      }
      return prev;
    });
  };

  const displayResults = useMemo(() => {
    if (!results.length) {
      return results;
    }
    const withScore = results.map((listing) => ({
      listing,
      score:
        listingFeedback[listing.id] === "like"
          ? 1
          : listingFeedback[listing.id] === "dislike"
          ? -1
          : 0,
    }));
    return withScore
      .sort((a, b) => b.score - a.score)
      .map((item) => item.listing);
  }, [results, listingFeedback]);

  const handleSearch = useCallback(async (queryOverride?: string) => {
    const query = (queryOverride ?? searchQuery).trim();
    if (!query) {
      toast.error("Введите запрос для поиска");
      return;
    }

    setError(null);
    setIsLoading(true);
    setSummaries({});
    setSummariesLoading({});
    setSelectedListing(null);
    setDetailsOpen(false);

    const params = new URLSearchParams();
    params.set("marketplace", "olx");
    params.set("q", query);

    const categoryValue = useCustomCategory ? customCategoryId.trim() : category;
    const categoryParam = resolveCategoryParam(categoryValue);
    if (categoryParam) {
      params.set("category", categoryParam);
    }
    if (minPrice.trim()) {
      params.set("minPrice", minPrice.trim());
    }
    if (maxPrice.trim()) {
      params.set("maxPrice", maxPrice.trim());
    }
    if (locationFilter.trim()) {
      params.set("location", locationFilter.trim());
    }
    if (condition !== "all") {
      params.set("condition", condition);
    }
    if (sellerType !== "all") {
      params.set("sellerType", sellerType);
    }
    if (sortBy && sortBy !== DEFAULT_SORT) {
      params.set("sortBy", sortBy);
    }
    if (withDelivery) {
      params.set("withDelivery", "true");
    }
    if (selectedDeliveryOptions.length) {
      selectedDeliveryOptions.forEach((option) => params.append("deliveryOptions", option));
    }

    try {
      const response = await fetch(`${backendUrl}/api/search?${params.toString()}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Не удалось выполнить поиск" }));
        throw new Error(body.error || "Ошибка запроса");
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "OLX не вернул результаты");
      }

  const parsed: ListingResult[] = (data.results ?? []).map((item: any) => {
        const rawImages = Array.isArray(item.images)
          ? (item.images
              .map((image: unknown) => sanitizeImageUrl(image))
              .filter(Boolean) as string[])
          : [];
        const primaryImage = sanitizeImageUrl(item.image) || rawImages[0] || undefined;
        const normalizedImages = rawImages.length
          ? rawImages
          : primaryImage
          ? [primaryImage]
          : [];

        const description =
          typeof item.description === "string" && item.description.trim().length
            ? item.description.trim()
            : undefined;

        let numericPrice: number | undefined;
        if (typeof item.price === "number" && Number.isFinite(item.price)) {
          numericPrice = item.price;
        } else if (typeof item.price === "string") {
          const parsed = Number.parseFloat(
            item.price
              .replace(/[^0-9,\.]/g, "")
              .replace(/,(\d{2})$/, ".$1")
              .replace(/\s+/g, ""),
          );
          if (Number.isFinite(parsed)) {
            numericPrice = parsed;
          }
        }

        const deliveryOptions = Array.isArray(item.deliveryOptions)
          ? item.deliveryOptions.filter((option: unknown) => typeof option === "string" && option.trim())
          : [];

        const attributes = Array.isArray(item.attributes)
          ? item.attributes.filter((attr: any) => attr && attr.label && attr.value)
          : [];

        const categoryPath = Array.isArray(item.categoryPath)
          ? item.categoryPath.filter((entry: unknown) => typeof entry === "string" && entry.trim())
          : undefined;

        const fallbackId =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const rawId = String(item.id ?? item.url ?? fallbackId);
        const canonicalId = rawId.trim() || fallbackId;

        return {
          id: canonicalId,
          title: item.title ?? "Без названия",
          price: formatListingPrice(item.price, item.currency),
          currency: item.currency,
          location: item.location ?? "Не указано",
          publishedAt: item.publishedAt,
          url: item.url ?? "#",
          image: primaryImage,
          images: normalizedImages.length ? normalizedImages : undefined,
          description,
          deliveryOptions: deliveryOptions.length ? (deliveryOptions as string[]) : undefined,
          deliveryAvailable: Boolean(item.deliveryAvailable ?? deliveryOptions.length > 0),
          sellerName: item.sellerName ?? item.seller?.name ?? null,
          sellerProfileUrl: item.sellerProfileUrl ?? item.seller?.url ?? null,
          sellerPhone: item.sellerPhone ?? null,
          sellerType: item.sellerType ?? null,
          categoryPath,
          attributes: attributes.length ? (attributes as ListingAttribute[]) : undefined,
          numericPrice,
        } satisfies ListingResult;
      });

      const uniqueResults: ListingResult[] = [];
      const seenIds = new Set<string>();
      const seenUrls = new Set<string>();

      for (const listing of parsed) {
        const normalizedId = listing.id.trim();
        const normalizedUrl = listing.url?.trim();

        if (normalizedId && seenIds.has(normalizedId)) {
          continue;
        }
        if (normalizedUrl && seenUrls.has(normalizedUrl)) {
          continue;
        }

        if (normalizedId) {
          seenIds.add(normalizedId);
        }
        if (normalizedUrl) {
          seenUrls.add(normalizedUrl);
        }

        uniqueResults.push(listing);
      }

      setRawResults(uniqueResults);
      setResults(uniqueResults);
      addSavedSearch(query);
      toast.success(`Найдено ${uniqueResults.length} объявлений`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось выполнить поиск";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    addSavedSearch,
    category,
    condition,
    customCategoryId,
    locationFilter,
    maxPrice,
    minPrice,
    searchQuery,
    selectedDeliveryOptions,
    sellerType,
    sortBy,
    useCustomCategory,
    withDelivery,
  ]);

  const handleSaveSearch = () => {
    const query = searchQuery.trim();
    if (!query) {
      toast.error("Введите запрос, чтобы сохранить поиск");
      return;
    }
    addSavedSearch(query);
    toast.success("Поиск сохранён", { description: query });
  };

  const toggleFavorite = (id: string) => {
    const listing =
      results.find((item) => item.id === id) ??
      favoriteListings.find((item) => item.id === id);
    if (!listing) return;
    toggleFavoriteListing({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      url: listing.url,
      location: listing.location,
    });
  };

  const runSavedSearch = useCallback(
    async (savedSearch: { id: string; query: string }) => {
      const query = savedSearch.query.trim();
      if (!query) {
        toast.error("Запрос пустой, редактируйте сохранённый поиск");
        return;
      }
      setSavedSearchesOpen(false);
      setSearchQuery(query);
      await handleSearch(query);
    },
    [handleSearch],
  );

  const handleRemoveSavedSearch = useCallback(
    (id: string, query: string) => {
      removeSavedSearch(id);
      toast.success("Поиск удалён", { description: query });
    },
    [removeSavedSearch],
  );

  const handleFeedback = (listing: ListingResult, feedback: "like" | "dislike") => {
    if (!canUseAI) {
      toast.error("Авторизуйтесь и настройте AI, чтобы ставить оценки объявлений");
      return;
    }
    const previous = listingFeedback[listing.id];
    setListingFeedback(listing.id, feedback);
    if (previous === feedback) {
      toast("Предпочтение сброшено", {
        description: listing.title,
      });
    } else {
      toast.success(feedback === "like" ? "Лайк сохранён" : "Дизлайк сохранён", {
        description: "AI запомнит ваш выбор",
      });
    }
  };

  const handleSummarize = async (listing: ListingResult) => {
    if (!canUseAI) {
      toast.error("Нужен вход и настроенный AI, чтобы получить описание");
      return;
    }

    const listingId = listing.id;
    setSummariesLoading((prev) => ({ ...prev, [listingId]: true }));

    try {
      const settings = getAISettings();
      const betterDealUrl = typeof window !== "undefined"
        ? `${window.location.origin}/market/best-deals?query=${encodeURIComponent(listing.title)}`
        : `https://my-dashboard.app/market/best-deals?query=${encodeURIComponent(listing.title)}`;

      const numericPrice =
        typeof listing.numericPrice === "number" && Number.isFinite(listing.numericPrice)
          ? listing.numericPrice
          : Number.parseFloat(
              (listing.price || "0")
                .replace(/[\s\u00A0]/g, "")
                .replace(/[^0-9.,-]/g, "")
                .replace(",", "."),
            );

      const prompt = `Ты — личный ассистент по выбору техники. Проанализируй объявление и ответь в формате JSON.

ДАННЫЕ:
- Название: ${listing.title}
- Цена: ${listing.price} (${Number.isFinite(numericPrice) ? `${numericPrice}` : "unknown"})
- Локация: ${listing.location ?? "Не указано"}
- Описание: ${listing.description ?? "Описание отсутствует"}

ТРЕБОВАНИЯ К ОТВЕТУ:
- Верни ТОЛЬКО валидный JSON без пояснений
- Поля: summary (1-2 предложения), decision ("buy" | "consider" | "avoid"), reason (почему такое решение), betterDealUrl (используй ссылку ${betterDealUrl})
- Укажи, стоит ли покупать и какие риски
- Если информации мало, попроси уточнить, но всё равно верни JSON
`;

      const response = await sendAIMessage(prompt, settings);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      let parsed: ListingSummary | null = null;

      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          if (data && data.summary && data.decision && data.reason) {
            parsed = {
              summary: String(data.summary),
              decision: ["buy", "consider", "avoid"].includes(data.decision)
                ? data.decision
                : "consider",
              reason: String(data.reason),
              betterDealUrl: String(data.betterDealUrl || betterDealUrl),
              raw: response,
            } as ListingSummary;
          }
        } catch (error) {
          console.warn("Failed to parse AI summary", error);
        }
      }

      const finalSummary: ListingSummary =
        parsed ?? {
          summary: response,
          decision: "consider",
          reason: "AI вернул свободный текст",
          betterDealUrl,
          raw: response,
        };

      setSummaries((prev) => ({ ...prev, [listingId]: finalSummary }));
      toast.success("Анализ готов", { description: listing.title });
    } catch (err) {
      console.error("AI summarize error", err);
      const message = err instanceof Error ? err.message : "Не удалось получить ответ AI";
      toast.error(message);
    } finally {
      setSummariesLoading((prev) => ({ ...prev, [listingId]: false }));
    }
  };

  const openDetails = (listing: ListingResult) => {
    setSelectedListing(listing);
    setDetailsOpen(true);
  };

  const detailSummary = selectedListing ? summaries[selectedListing.id] : undefined;
  const detailFeedback = selectedListing ? listingFeedback[selectedListing.id] : undefined;
  const detailImageCandidate =
    selectedListing &&
    (selectedListing.images?.find((src) => typeof src === "string" && src.length > 10) ??
      selectedListing.image);
  const detailImage =
    detailImageCandidate && detailImageCandidate.length > 10 ? detailImageCandidate : placeholderImage;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1>OLX Поиск</h1>
        <p className="text-muted-foreground">Поиск объявлений с расширенными фильтрами</p>
      </div>

      <Dialog
        open={detailsOpen && Boolean(selectedListing)}
        onOpenChange={(open: boolean) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedListing(null);
          }
        }}
      >
  <DialogContent className="max-w-2xl max-h-[90vh] space-y-4 overflow-y-auto">
          {selectedListing && (
            <>
              <DialogHeader className="space-y-2">
                <DialogTitle className="leading-snug">{selectedListing.title}</DialogTitle>
                <DialogDescription className="text-base font-medium text-green-500">
                  {selectedListing.price}
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-hidden rounded-lg border">
                <img
                  src={detailImage}
                  alt={selectedListing.title}
                  className="h-64 w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {selectedListing.images && selectedListing.images.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                  {selectedListing.images.slice(1, 7).map((src, idx) => (
                    <img
                      key={`${src}-${idx}`}
                      src={src}
                      alt={`Доп фото ${idx + 1}`}
                      className="h-16 w-24 flex-none rounded-md border object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              )}

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedListing.location ?? "Локация не указана"}</span>
                </div>
                {selectedListing.publishedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(selectedListing.publishedAt).toLocaleString()}</span>
                  </div>
                )}
                {selectedListing.deliveryAvailable && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Truck className="h-4 w-4" />
                    <span>Доступна доставка OLX или курьер</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Описание</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {selectedListing.description?.trim() ?? "Описание не найдено. Откройте объявление для подробностей."}
                </p>
              </div>

              {selectedListing.deliveryOptions && selectedListing.deliveryOptions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Способы доставки</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.deliveryOptions.map((option, idx) => (
                      <Badge key={`${option}-${idx}`} variant="outline" className="gap-1">
                        <Truck className="h-3 w-3" />
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(selectedListing.sellerName || selectedListing.sellerType || selectedListing.sellerPhone ||
                selectedListing.sellerProfileUrl) && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <User className="h-4 w-4" />
                    <span>{selectedListing.sellerName || "Продавец"}</span>
                  </div>
                  {selectedListing.sellerType && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{selectedListing.sellerType}</span>
                    </div>
                  )}
                  {selectedListing.sellerPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{selectedListing.sellerPhone}</span>
                    </div>
                  )}
                  {selectedListing.sellerProfileUrl && (
                    <Button
                      variant="link"
                      className="px-0 text-sm font-semibold"
                      onClick={() => window.open(selectedListing.sellerProfileUrl!, "_blank", "noopener,noreferrer")}
                    >
                      Профиль продавца
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {selectedListing.categoryPath && selectedListing.categoryPath.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Категория</h4>
                  <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                    {selectedListing.categoryPath.map((crumb, index) => (
                      <span key={`${crumb}-${index}`} className="flex items-center gap-1">
                        <span>{crumb}</span>
                        {index < selectedListing.categoryPath!.length - 1 && <span>›</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedListing.attributes && selectedListing.attributes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Характеристики</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedListing.attributes.map((attribute) => (
                      <div
                        key={`${attribute.label}-${attribute.value}`}
                        className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm"
                      >
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {attribute.label}
                        </p>
                        <p className="font-medium text-foreground">{attribute.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailSummary && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-semibold text-foreground">AI анализ</span>
                    <Badge
                      variant="outline"
                      className={`border ${DECISION_META[detailSummary.decision].className}`}
                    >
                      {DECISION_META[detailSummary.decision].label}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">{detailSummary.summary}</p>
                  <p className="text-sm text-muted-foreground leading-snug">{detailSummary.reason}</p>
                  <Button
                    variant="link"
                    className="px-0"
                    onClick={() => window.open(detailSummary.betterDealUrl, "_blank")}
                  >
                    Посмотреть более выгодный вариант
                  </Button>
                </div>
              )}

              {canUseAI && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={detailFeedback === "like" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleFeedback(selectedListing, "like")}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Нравится
                  </Button>
                  <Button
                    variant={detailFeedback === "dislike" ? "destructive" : "ghost"}
                    size="sm"
                    onClick={() => handleFeedback(selectedListing, "dislike")}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Не подходит
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSummarize(selectedListing)}
                    disabled={Boolean(summariesLoading[selectedListing.id])}
                  >
                    {summariesLoading[selectedListing.id] ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Сократить ещё раз
                  </Button>
                </div>
              )}

              <DialogFooter>
                <Button variant="secondary" onClick={() => setDetailsOpen(false)}>
                  Закрыть
                </Button>
                <Button onClick={() => window.open(selectedListing.url, "_blank")}>
                  Открыть объявление
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Search Bar */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Что вы ищете?"
                className="pl-9"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isLoading ? "Поиск..." : "Поиск"}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
            <Select
              value={primaryCategory}
              onValueChange={(value: string) => {
                setPrimaryCategory(value);
                setSecondaryCategory("all");
                setTertiaryCategory("all");
                setUseCustomCategory(false);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Основная категория" />
              </SelectTrigger>
              <SelectContent>
                {primarySelectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={secondaryCategory}
              onValueChange={(value: string) => {
                setSecondaryCategory(value);
                setTertiaryCategory("all");
                setUseCustomCategory(false);
              }}
              disabled={primaryCategory === "all"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Подкатегория" />
              </SelectTrigger>
              <SelectContent>
                {secondarySelectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={tertiaryCategory}
              onValueChange={(value: string) => {
                setTertiaryCategory(value);
                setUseCustomCategory(false);
              }}
              disabled={secondaryCategory === "all"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Раздел" />
              </SelectTrigger>
              <SelectContent>
                {tertiarySelectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Город или регион"
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
            />

            <Input
              placeholder="Мин. цена"
              type="number"
              inputMode="numeric"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
            />
            <Input
              placeholder="Макс. цена"
              type="number"
              inputMode="numeric"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                {OLX_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={filtersOpen ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFiltersCount ? `Фильтры (${activeFiltersCount})` : "Расширенные фильтры"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={activeFiltersCount === 0}
            >
              Сбросить
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveSearch}>
              Сохранить поиск
            </Button>
          </div>
        </CardContent>
      </Card>

  <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Расширенные фильтры</DialogTitle>
            <DialogDescription>
              Настройте параметры поиска, чтобы точнее находить подходящие объявления.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Состояние</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Любое" />
                </SelectTrigger>
                <SelectContent>
                  {conditionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Тип продавца</Label>
              <Select value={sellerType} onValueChange={setSellerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Любой" />
                </SelectTrigger>
                <SelectContent>
                  {OLX_SELLER_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Категория по ID</Label>
              <div className="flex items-center gap-2">
                <Switch checked={useCustomCategory} onCheckedChange={setUseCustomCategory} />
                <span className="text-sm text-muted-foreground">Указать ID вручную</span>
              </div>
              <Input
                placeholder="Например, 505"
                value={customCategoryId}
                onChange={(event) => setCustomCategoryId(event.target.value.replace(/[^0-9]/g, ""))}
                disabled={!useCustomCategory}
              />
              <p className="text-xs text-muted-foreground">
                ID можно найти в адресной строке OLX (параметр <code>category_id</code>).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Только объявления с фото</Label>
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                <Switch checked={onlyWithImages} onCheckedChange={setOnlyWithImages} />
                <span className="text-sm">Скрывать предложения без изображений</span>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label>Способы доставки</Label>
              <div className="flex flex-wrap gap-3">
                {OLX_DELIVERY_OPTIONS.map((option) => {
                  const id = `delivery-${option.value}`;
                  return (
                    <div
                      key={option.value}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs"
                    >
                      <Checkbox
                        id={id}
                        checked={selectedDeliveryOptions.includes(option.value)}
                        onCheckedChange={(checked: CheckboxState) =>
                          handleDeliveryChange(option.value, checked === true)
                        }
                      />
                      <Label htmlFor={id} className="cursor-pointer text-xs font-medium">
                        {option.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Фильтры по характеристикам</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(ATTRIBUTE_FILTER_META) as AttributeFilterKey[]).map((key) => {
                const options = attributeOptions[key];
                const meta = ATTRIBUTE_FILTER_META[key];
                return (
                  <div key={key} className="space-y-2">
                    <Label>{meta.label}</Label>
                    <Select
                      value={attributeFilters[key]}
                      onValueChange={(value: string) =>
                        setAttributeFilters((prev) => ({
                          ...prev,
                          [key]: value,
                        }))
                      }
                      disabled={!options.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Любое" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все</SelectItem>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!options.length && (
                      <p className="text-xs text-muted-foreground">
                        Значения появятся после первого поиска по выбранной категории.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Активно фильтров: <span className="font-semibold text-foreground">{activeFiltersCount}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Сбросить всё
              </Button>
              <Button onClick={() => setFiltersOpen(false)}>Готово</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-muted-foreground">
            Найдено: {isLoading ? "..." : displayResults.length}
          </span>
          <div className="flex gap-2">
            <Popover open={favoritesOpen} onOpenChange={setFavoritesOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Избранное ({favoriteListings.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="border-b p-3 text-sm font-semibold">Избранные объявления</div>
                {sortedFavorites.length ? (
                  <ScrollArea className="max-h-72">
                    <div className="divide-y">
                      {sortedFavorites.map((favorite) => (
                        <div key={favorite.id} className="flex items-start gap-3 p-3">
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-semibold leading-snug">
                              {favorite.title}
                            </p>
                            <p className="text-xs text-muted-foreground">{favorite.price}</p>
                            {favorite.location ? (
                              <p className="text-xs text-muted-foreground">{favorite.location}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setFavoritesOpen(false);
                                window.open(favorite.url, "_blank", "noopener,noreferrer");
                              }}
                              title="Открыть объявление"
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFavorite(favorite.id)}
                              title="Убрать из избранного"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">
                    Добавьте объявления в избранное, чтобы быстро к ним возвращаться.
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Popover open={savedSearchesOpen} onOpenChange={setSavedSearchesOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Сохранённые поиски ({savedSearches.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="border-b p-3 text-sm font-semibold">Сохранённые запросы</div>
                {sortedSavedSearches.length ? (
                  <ScrollArea className="max-h-72">
                    <div className="divide-y">
                      {sortedSavedSearches.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 p-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug">{item.query}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleString()
                                : "Дата неизвестна"}
                            </p>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => runSavedSearch(item)}
                              title="Повторить поиск"
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSavedSearch(item.id, item.query)}
                              title="Удалить поиск"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">
                    Сохраняйте успешные запросы, чтобы возвращаться к ним в один клик.
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayResults.map((item, index) => {
              const summary = summaries[item.id];
              const decisionMeta = summary ? DECISION_META[summary.decision] : null;
              const isSummarizing = Boolean(summariesLoading[item.id]);
              const primaryImage =
                item.images?.find((src) => typeof src === "string" && src.length > 10) ??
                (item.image && item.image.length > 10 ? item.image : undefined);
              const imageSrc = primaryImage ?? placeholderImage;
              const feedback = listingFeedback[item.id];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={imageSrc}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {decisionMeta ? (
                        <Badge
                          variant="outline"
                          className={`absolute left-2 top-2 border ${decisionMeta.className}`}
                        >
                          {decisionMeta.label}
                        </Badge>
                      ) : (
                        index < 3 && (
                          <Badge className="absolute left-2 top-2 gap-1">
                            <Star className="h-3 w-3" />
                            Топ
                          </Badge>
                        )
                      )}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => toggleFavorite(item.id)}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favoriteIds.has(item.id) ? "fill-current text-red-500" : ""
                          }`}
                        />
                      </Button>
                      {item.deliveryAvailable && (
                        <Badge className="absolute left-2 bottom-2 flex items-center gap-1 bg-emerald-500/80 text-white shadow-sm">
                          <Truck className="h-3 w-3" />
                          С доставкой
                        </Badge>
                      )}
                    </div>
                    <CardContent className="space-y-3 p-4">
                      <div className="space-y-1">
                        <h4 className="line-clamp-2 font-semibold leading-snug">{item.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-green-500 font-medium">{item.price}</span>
                          {summary && decisionMeta && (
                            <Badge
                              variant="outline"
                              className={`border ${decisionMeta.className}`}
                            >
                              {decisionMeta.label}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {item.location && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>{item.location}</span>
                        </div>
                      )}
                      {item.publishedAt && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(item.publishedAt).toLocaleString()}</span>
                        </div>
                      )}

                      {summary && (
                        <div className="rounded-md border border-border/50 bg-muted/40 p-3 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{summary.summary}</p>
                          <p className="mt-2 leading-snug">{summary.reason}</p>
                          <Button
                            variant="link"
                            className="px-0"
                            onClick={() => window.open(summary.betterDealUrl, "_blank")}
                          >
                            Лучшее предложение
                          </Button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSummarize(item)}
                          disabled={isSummarizing}
                        >
                          {isSummarizing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          Сократить
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => openDetails(item)}>
                          <Info className="mr-2 h-4 w-4" />
                          Подробнее
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.url, "_blank")}
                        >
                          Открыть объявление
                        </Button>
                      </div>

                      {canUseAI && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <Button
                            variant={feedback === "like" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handleFeedback(item, "like")}
                          >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Нравится
                          </Button>
                          <Button
                            variant={feedback === "dislike" ? "destructive" : "ghost"}
                            size="sm"
                            onClick={() => handleFeedback(item, "dislike")}
                          >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            Не подходит
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
