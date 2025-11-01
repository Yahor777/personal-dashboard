import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  Target,
  Search,
  Cpu,
  Sparkles,
  BookOpen,
  Clock,
  FolderOpen,
  Image as ImageIcon,
  Download,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { useState } from "react";
import { motion } from "motion/react";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

interface NavGroup {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
  }[];
}

const navGroups: NavGroup[] = [
  {
    title: "Основное",
    items: [
      { id: "dashboard", label: "Главная", icon: LayoutDashboard },
      { id: "tasks", label: "Задачи", icon: CheckSquare },
      { id: "analytics", label: "Аналитика", icon: BarChart3 },
    ],
  },
  {
    title: "Инструменты",
    items: [
      { id: "olx", label: "OLX Поиск", icon: Search },
      { id: "pc-builder", label: "PC Builder", icon: Cpu },
      { id: "ai", label: "AI Ассистент", icon: Sparkles },
    ],
  },
  {
    title: "Обучение",
    items: [
      { id: "python", label: "Python Learning", icon: BookOpen },
      { id: "cs2", label: "CS2 Tracker", icon: Target },
    ],
  },
  {
    title: "Недавние",
    items: [
      { id: "recent-searches", label: "Недавние Поиски", icon: Clock },
      { id: "recent-projects", label: "Недавние Проекты", icon: FolderOpen },
    ],
  },
  {
    title: "Системные",
    items: [
      { id: "gallery", label: "Галерея", icon: ImageIcon },
      { id: "import-export", label: "Импорт/Экспорт", icon: Download },
      { id: "settings", label: "Настройки", icon: Settings },
    ],
  },
];

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<string[]>(
    navGroups.map((g) => g.title)
  );

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-4">
          {navGroups.map((group) => (
            <Collapsible
              key={group.title}
              open={openGroups.includes(group.title)}
              onOpenChange={() => toggleGroup(group.title)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between px-2 h-8"
                >
                  <span className="text-muted-foreground">{group.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openGroups.includes(group.title) ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3 px-3"
                        onClick={() => onPageChange(item.id)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Button>
                    </motion.div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
