import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
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
  Plus,
  FileText,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (page: string) => void;
}

const pages = [
  { id: "dashboard", label: "Главная", icon: LayoutDashboard },
  { id: "tasks", label: "Задачи", icon: CheckSquare },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
  { id: "cs2", label: "CS2 Tracker", icon: Target },
  { id: "olx", label: "OLX Поиск", icon: Search },
  { id: "pc-builder", label: "PC Builder", icon: Cpu },
  { id: "ai", label: "AI Ассистент", icon: Sparkles },
  { id: "python", label: "Python Learning", icon: BookOpen },
  { id: "recent-searches", label: "Недавние Поиски", icon: Clock },
  { id: "recent-projects", label: "Недавние Проекты", icon: FolderOpen },
  { id: "gallery", label: "Галерея", icon: ImageIcon },
  { id: "import-export", label: "Импорт/Экспорт", icon: Download },
  { id: "settings", label: "Настройки", icon: Settings },
];

const quickActions = [
  { id: "new-task", label: "Создать новую задачу", icon: Plus },
  { id: "new-project", label: "Создать новый проект", icon: FileText },
  { id: "new-search", label: "Новый поиск", icon: Search },
];

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
}: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (id: string) => {
    if (pages.find((p) => p.id === id)) {
      onNavigate(id);
      onOpenChange(false);
    } else {
      // Handle quick actions
      console.log("Quick action:", id);
      onOpenChange(false);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Введите команду или найдите..." />
      <CommandList>
        <CommandEmpty>Ничего не найдено.</CommandEmpty>
        <CommandGroup heading="Быстрые действия">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem
                key={action.id}
                onSelect={() => handleSelect(action.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{action.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup heading="Навигация">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem key={page.id} onSelect={() => handleSelect(page.id)}>
                <Icon className="mr-2 h-4 w-4" />
                <span>{page.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
