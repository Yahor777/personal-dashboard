import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Search, Copy, Archive, ExternalLink, FolderOpen } from "lucide-react";
import { motion } from "motion/react";

const projects = [
  { id: 1, name: "Дизайн интерфейса Dashboard", status: "В процессе", tags: ["UI/UX", "Figma"], updated: "2 часа назад", progress: 65 },
  { id: 2, name: "Анализ данных продаж", status: "Выполнено", tags: ["Python", "Analytics"], updated: "Вчера", progress: 100 },
  { id: 3, name: "API интеграция", status: "В процессе", tags: ["Backend", "Node.js"], updated: "3 дня назад", progress: 45 },
  { id: 4, name: "Сборка игрового ПК", status: "Планирование", tags: ["Hardware", "PC"], updated: "5 дней назад", progress: 20 },
  { id: 5, name: "Изучение React Hooks", status: "В процессе", tags: ["React", "Frontend"], updated: "1 неделю назад", progress: 75 },
  { id: 6, name: "Создание лендинга", status: "Выполнено", tags: ["Web", "Design"], updated: "2 недели назад", progress: 100 },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Выполнено":
      return "default";
    case "В процессе":
      return "secondary";
    case "Планирование":
      return "outline";
    default:
      return "secondary";
  }
};

export function RecentProjects() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Недавние Проекты</h1>
          <p className="text-muted-foreground">Управление вашими проектами</p>
        </div>
        <Button>Новый проект</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск проектов..." className="pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="progress">В процессе</SelectItem>
            <SelectItem value="done">Выполнено</SelectItem>
            <SelectItem value="planning">Планирование</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="updated">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">По обновлению</SelectItem>
            <SelectItem value="name">По имени</SelectItem>
            <SelectItem value="progress">По прогрессу</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="group transition-shadow hover:shadow-lg">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <h4 className="line-clamp-2">{project.name}</h4>
                  </div>
                </div>

                <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>

                <div className="flex flex-wrap gap-1">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Прогресс</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{project.updated}</span>
                </div>

                <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="sm" variant="outline" className="flex-1 gap-2">
                    <ExternalLink className="h-3 w-3" />
                    Открыть
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Archive className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Всего проектов</span>
              <span>{projects.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">В процессе</span>
              <span>{projects.filter((p) => p.status === "В процессе").length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Завершено</span>
              <span>{projects.filter((p) => p.status === "Выполнено").length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
