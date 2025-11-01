import { useEffect, useMemo, useState } from "react";
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

interface ListingResult {
  id: string;
  title: string;
  price: string;
  currency?: string;
  location?: string;
  publishedAt?: string;
  url: string;
  image?: string;
  description?: string;
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

export function OLXSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ListingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const favoriteListings = useDashboardStore((state) => state.favoriteListings);
  const toggleFavoriteListing = useDashboardStore((state) => state.toggleFavoriteListing);
  const addSavedSearch = useDashboardStore((state) => state.addSavedSearch);
  const savedSearches = useDashboardStore((state) => state.savedSearches);
  const currentUser = useDashboardStore((state) => state.currentUser);
  const listingFeedback = useDashboardStore((state) => state.listingFeedback);
  const setListingFeedback = useDashboardStore((state) => state.setListingFeedback);
  const [aiSettings, setAISettingsState] = useState<AISettings | null>(() =>
    typeof window !== "undefined" ? getAISettings() : null
  );
  const [summaries, setSummaries] = useState<Record<string, ListingSummary>>({});
  const [summariesLoading, setSummariesLoading] = useState<Record<string, boolean>>({});
  const [selectedListing, setSelectedListing] = useState<ListingResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const favoriteIds = useMemo(() => new Set(favoriteListings.map((item) => item.id)), [favoriteListings]);

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

  const handleSearch = () => {
    setError(null);
    setIsLoading(true);
    setSummaries({});
    setSummariesLoading({});
    setSelectedListing(null);
    setDetailsOpen(false);
    const query = searchQuery.trim();
    if (!query) {
      toast.error("Введите запрос для поиска");
      setIsLoading(false);
      return;
    }

    fetch(`${backendUrl}/api/search?marketplace=olx&q=${encodeURIComponent(query)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Не удалось выполнить поиск" }));
          throw new Error(body.error || "Ошибка запроса");
        }
        return res.json();
      })
      .then((data) => {
        if (!data.ok) {
          throw new Error(data.error || "OLX не вернул результаты");
        }
        const parsed: ListingResult[] = (data.results ?? []).map((item: any) => ({
          id: String(item.id ?? item.url ?? Math.random()),
          title: item.title ?? "Без названия",
          price: item.price ? `${item.price}${item.currency ? ` ${item.currency}` : ""}` : "Цена уточняется",
          currency: item.currency,
          location: item.location ?? "Не указано",
          publishedAt: item.publishedAt,
          url: item.url ?? "#",
          image: item.image,
          description: item.description,
        }));
        setResults(parsed);
        addSavedSearch(query);
        toast.success(`Найдено ${parsed.length} объявлений`);
      })
      .catch((err: Error) => {
        console.error("OLX search error", err);
        setError(err.message || "Не удалось выполнить поиск");
        toast.error(err.message || "Ошибка поиска OLX");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const toggleFavorite = (id: string) => {
    const listing = results.find((item) => item.id === id);
    if (!listing) return;
    toggleFavoriteListing({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      url: listing.url,
      location: listing.location,
    });
  };

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

      const numericPrice = Number.parseFloat(
        (listing.price || "0").replace(/[\s\u00A0]/g, "").replace(/[^0-9.,-]/g, "").replace(",", ".")
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
  const detailImage = selectedListing && selectedListing.image && selectedListing.image.length > 10
    ? selectedListing.image
    : placeholderImage;

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
        <DialogContent className="max-w-2xl space-y-4">
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
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Описание</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {selectedListing.description || "Описание не найдено. Откройте объявление для подробностей."}
                </p>
              </div>

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
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Что вы ищете?"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>Поиск</Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                <SelectItem value="electronics">Электроника</SelectItem>
                <SelectItem value="computers">Компьютеры</SelectItem>
                <SelectItem value="phones">Телефоны</SelectItem>
              </SelectContent>
            </Select>

            <Input placeholder="Мин. цена" type="number" />
            <Input placeholder="Макс. цена" type="number" />

            <Select defaultValue="newest">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Новые</SelectItem>
                <SelectItem value="price-low">Цена: низкая</SelectItem>
                <SelectItem value="price-high">Цена: высокая</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Расширенные фильтры
            </Button>
            <Button variant="outline" size="sm">
              Сохранить поиск
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-muted-foreground">
            Найдено: {isLoading ? "..." : displayResults.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Избранное ({favoriteListings.length})
            </Button>
            <Button variant="outline" size="sm">
              Сохранённые поиски ({savedSearches.length})
            </Button>
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
              const imageSrc = item.image && item.image.length > 10 ? item.image : placeholderImage;
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
