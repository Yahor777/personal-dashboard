import { useMemo, useState, type DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Search, Filter, Plus, Paperclip, Calendar, Tag, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useDashboardStore, type Task } from "../../store/dashboardStore";
import { toast } from "sonner";

const columns = [
  { id: "todo", title: "К изучению", color: "bg-blue-500/10 border-blue-500/20" },
  { id: "progress", title: "В процессе", color: "bg-yellow-500/10 border-yellow-500/20" },
  { id: "done", title: "Выполнено", color: "bg-green-500/10 border-green-500/20" },
];

export function TasksKanban() {
  const tasks = useDashboardStore((state) => state.tasks);
  const addTask = useDashboardStore((state) => state.addTask);
  const updateTask = useDashboardStore((state) => state.updateTask);
  const deleteTask = useDashboardStore((state) => state.deleteTask);
  const moveTask = useDashboardStore((state) => state.moveTask);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    tags: "",
    priority: "medium" as Task["priority"],
    progress: 0,
    date: new Date().toISOString().slice(0, 10),
    attachments: 0,
    column: "todo" as Task["column"],
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const openTaskDrawer = (task?: Task) => {
    if (task) {
      setEditingTaskId(task.id);
      setFormState({
        title: task.title,
        description: task.description,
        tags: task.tags.join(", "),
        priority: task.priority,
        progress: task.progress,
        date: task.date,
        attachments: task.attachments,
        column: task.column,
      });
    } else {
      setEditingTaskId(null);
      setFormState({
        title: "",
        description: "",
        tags: "",
        priority: "medium",
        progress: 0,
        date: new Date().toISOString().slice(0, 10),
        attachments: 0,
        column: "todo",
      });
    }
    setDrawerOpen(true);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;
    moveTask(taskId, columnId as Task["column"]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const handleSubmit = () => {
    if (!formState.title.trim()) {
      toast.error("Введите название задачи");
      return;
    }

    const tags = formState.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (editingTaskId) {
      updateTask(editingTaskId, {
        title: formState.title,
        description: formState.description,
        tags,
        priority: formState.priority,
        progress: Math.min(100, Math.max(0, formState.progress)),
        date: formState.date,
        attachments: formState.attachments,
        column: formState.column,
      });
      toast.success("Задача обновлена");
    } else {
      addTask({
        title: formState.title,
        description: formState.description,
        tags,
        priority: formState.priority,
        progress: Math.min(100, Math.max(0, formState.progress)),
        date: formState.date,
        attachments: formState.attachments,
        column: formState.column,
      });
      toast.success("Новая задача создана");
    }

    setDrawerOpen(false);
  };

  const handleDelete = () => {
    if (!editingTaskId) {
      setDrawerOpen(false);
      return;
    }
    deleteTask(editingTaskId);
    toast.success("Задача удалена");
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Канбан Доска</h1>
          <p className="text-muted-foreground">Управляйте задачами с помощью drag & drop</p>
        </div>
        <Button className="gap-2" onClick={() => openTaskDrawer()}>
          <Plus className="h-4 w-4" />
          Новая задача
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск задач..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Приоритет" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все приоритеты</SelectItem>
            <SelectItem value="high">Высокий</SelectItem>
            <SelectItem value="medium">Средний</SelectItem>
            <SelectItem value="low">Низкий</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-6 lg:grid-cols-3">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <Card className={column.color}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {column.title}
                  <Badge variant="secondary">
                    {filteredTasks.filter((t) => t.column === column.id).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            <div
              className="space-y-3 min-h-[400px]"
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={handleDragOver}
            >
              {filteredTasks
                .filter((task) => task.column === column.id)
                .map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e as unknown as DragEvent<HTMLDivElement>, task.id)
                    }
                    className="cursor-move"
                    onClick={() => openTaskDrawer(task)}
                  >
                    <Card className="transition-shadow hover:shadow-lg">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between">
                          <h4>{task.title}</h4>
                          <Badge variant={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-muted-foreground line-clamp-3">{task.description}</p>
                        )}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Прогресс</span>
                            <span>{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} />
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{task.date}</span>
                          </div>
                          {task.attachments > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-4 w-4" />
                              <span>{task.attachments}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingTaskId ? "Редактировать задачу" : "Новая задача"}</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={formState.title}
                onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Например: Изучить Zustand"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Опишите ключевые детали"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Приоритет</Label>
                <Select
                  value={formState.priority}
                  onValueChange={(value: Task["priority"]) =>
                    setFormState((prev) => ({ ...prev, priority: value as Task["priority"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="low">Низкий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Дата</Label>
                <Input
                  type="date"
                  value={formState.date}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Колонка</Label>
                <Select
                  value={formState.column}
                  onValueChange={(value: Task["column"]) =>
                    setFormState((prev) => ({ ...prev, column: value as Task["column"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">К изучению</SelectItem>
                    <SelectItem value="progress">В процессе</SelectItem>
                    <SelectItem value="done">Выполнено</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Прогресс (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formState.progress}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, progress: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-tags">Теги</Label>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="task-tags"
                  placeholder="Введите теги через запятую"
                  value={formState.tags}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, tags: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Количество вложений</Label>
              <Input
                type="number"
                min={0}
                value={formState.attachments}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, attachments: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingTaskId ? "Сохранить" : "Создать задачу"}
                </Button>
                {editingTaskId && (
                  <Button variant="outline" onClick={handleDelete} className="flex-1 text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </Button>
                )}
              </div>
              <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                Отменить
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
