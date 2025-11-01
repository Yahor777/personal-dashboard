import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, Pin, Trash2, RefreshCw, Filter } from "lucide-react";
import { motion } from "motion/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const searches = [
  { id: 1, query: "RTX 4070 Ti", source: "OLX", results: 12, date: "5 мин назад", pinned: true, params: "₽50,000-60,000" },
  { id: 2, query: "Python курсы онлайн", source: "Внутренний", results: 8, date: "1 час назад", pinned: false, params: "Бесплатно" },
  { id: 3, query: "Samsung Galaxy S24", source: "OLX", results: 24, date: "2 часа назад", pinned: true, params: "Москва" },
  { id: 4, query: "Монитор 27 дюймов 165Hz", source: "OLX", results: 18, date: "3 часа назад", pinned: false, params: "₽25,000-35,000" },
  { id: 5, query: "React компоненты", source: "Внутренний", results: 15, date: "Вчера", pinned: false, params: "Туториалы" },
  { id: 6, query: "Corsair клавиатура механическая", source: "OLX", results: 9, date: "Вчера", pinned: false, params: "Новая" },
];

export function RecentSearches() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Недавние Поиски</h1>
          <p className="text-muted-foreground">История ваших поисковых запросов</p>
        </div>
        <Button variant="outline">Очистить историю</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск в истории..." className="pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все источники</SelectItem>
            <SelectItem value="olx">OLX</SelectItem>
            <SelectItem value="internal">Внутренний</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pinned Searches */}
      <div>
        <h3 className="mb-4">Закреплённые</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {searches
            .filter((s) => s.pinned)
            .map((search, index) => (
              <motion.div
                key={search.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="transition-shadow hover:shadow-lg">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <h4 className="line-clamp-1">{search.query}</h4>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary">{search.source}</Badge>
                          <Badge variant="outline">{search.results} результатов</Badge>
                          <Badge variant="outline">{search.params}</Badge>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost">
                        <Pin className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{search.date}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      </div>

      {/* All Searches */}
      <div>
        <h3 className="mb-4">Все поиски</h3>
        <div className="space-y-3">
          {searches.map((search, index) => (
            <motion.div
              key={search.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span>{search.query}</span>
                      {search.pinned && <Pin className="h-3 w-3 fill-current text-muted-foreground" />}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{search.source}</Badge>
                      <Badge variant="outline">{search.results} результатов</Badge>
                      <Badge variant="outline">{search.params}</Badge>
                      <span className="text-muted-foreground">• {search.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Pin className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
