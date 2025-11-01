import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowUpRight, TrendingUp, CheckCircle2, Search, Plus, FileText, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useDashboardStore } from "../../store/dashboardStore";

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const chartData = [
  { name: "Пн", value: 45 },
  { name: "Вт", value: 52 },
  { name: "Ср", value: 61 },
  { name: "Чт", value: 58 },
  { name: "Пт", value: 70 },
  { name: "Сб", value: 65 },
  { name: "Вс", value: 73 },
];

const recentProjects = [
  { name: "Дизайн сайта", status: "В процессе", tags: ["UI/UX", "Web"], progress: 65 },
  { name: "Анализ данных", status: "Выполнено", tags: ["Python", "Data"], progress: 100 },
  { name: "Сборка ПК", status: "Планирование", tags: ["Hardware"], progress: 20 },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const tasks = useDashboardStore((state) => state.tasks);
  const savedSearches = useDashboardStore((state) => state.savedSearches);
  const favoriteListings = useDashboardStore((state) => state.favoriteListings);
  const addSavedSearch = useDashboardStore((state) => state.addSavedSearch);

  const activeTasks = tasks.filter((task) => task.column !== "done");
  const completedToday = tasks.filter((task) => task.column === "done").length;

  const kpiData = [
    { title: "Активные задачи", value: String(activeTasks.length), change: "+" + activeTasks.length, icon: CheckCircle2 },
    { title: "Завершено", value: String(completedToday), change: "Сегодня", icon: TrendingUp },
    { title: "Сохранённые поиски", value: String(savedSearches.length), change: favoriteListings.length ? `${favoriteListings.length} избранных` : "+0", icon: Search },
  ];

  const handleCreateTask = () => {
    toast.success("Создание новой задачи...");
    onNavigate?.("tasks");
  };

  const handleNewSearch = () => {
    toast.success("Открытие поиска OLX...");
    onNavigate?.("olx");
  };

  const handleImport = () => {
    toast.success("Открытие импорта данных...");
    onNavigate?.("import-export");
  };

  const handleQuickSearchSave = () => {
    addSavedSearch("Новый поиск");
    toast.success("Сохранён новый поиск");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Главная</h1>
          <p className="text-muted-foreground">
            Добро пожаловать обратно! Вот краткая сводка.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleImport}>
            <Upload className="h-4 w-4" />
            Импорт
          </Button>
          <Button className="gap-2" onClick={handleCreateTask}>
            <Plus className="h-4 w-4" />
            Создать
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>{kpi.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span>{kpi.value}</span>
                    <Badge variant="secondary" className="gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      {kpi.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Активность за неделю</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleCreateTask}
              >
                <Plus className="h-4 w-4" />
                Создать новую задачу
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleNewSearch}
              >
                <Search className="h-4 w-4" />
                Новый поиск OLX
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => {
                  toast.success("Создание нового проекта...");
                  onNavigate?.("recent-projects");
                }}
              >
                <FileText className="h-4 w-4" />
                Новый проект
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleImport}
              >
                <Upload className="h-4 w-4" />
                Импортировать данные
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleQuickSearchSave}
              >
                <Search className="h-4 w-4" />
                Сохранить быстрый поиск
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Недавние проекты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.map((project, index) => (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span>{project.name}</span>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                  <div className="flex gap-1">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Searches */}
        <Card>
          <CardHeader>
            <CardTitle>Недавние поиски</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedSearches.slice(-5).reverse().map((search, index) => (
              <motion.div
                key={search.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>{search.query}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="secondary">OLX</Badge>
                    <span>•</span>
                    <span>{new Date(search.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  Повторить
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
