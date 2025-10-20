import { useEffect, useState } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from './ui/command';
import { Search, Home, Settings, BarChart3, Sparkles, ShoppingCart, Cpu, Code2, Gamepad2, BookOpen, Download } from 'lucide-react';

interface QuickNavigationProps {
  onNavigate: (page: string) => void;
}

export function QuickNavigation({ onNavigate }: QuickNavigationProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (page: string) => {
    setOpen(false);
    onNavigate(page);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Поиск страницы... (Ctrl+K)" />
      <CommandList>
        <CommandEmpty>Ничего не найдено.</CommandEmpty>
        
        <CommandGroup heading="🏠 Главное">
          <CommandItem onSelect={() => handleSelect('home')}>
            <Home className="mr-2 size-4" />
            <span>Главная</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+H</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('settings')}>
            <Settings className="mr-2 size-4" />
            <span>Настройки</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+S</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('analytics')}>
            <BarChart3 className="mr-2 size-4" />
            <span>Аналитика</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+A</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="🚀 Инструменты">
          <CommandItem onSelect={() => handleSelect('ai')}>
            <Sparkles className="mr-2 size-4" />
            <span>AI Ассистент</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+I</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('olx')}>
            <ShoppingCart className="mr-2 size-4" />
            <span>OLX Marketplace</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+O</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('pcbuilder')}>
            <Cpu className="mr-2 size-4" />
            <span>PC Builder</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+P</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="📚 Обучение">
          <CommandItem onSelect={() => handleSelect('python')}>
            <Code2 className="mr-2 size-4" />
            <span>Python Tracker</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+Y</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('student')}>
            <BookOpen className="mr-2 size-4" />
            <span>Student Dashboard</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+D</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="🎮 Игры">
          <CommandItem onSelect={() => handleSelect('cs2')}>
            <Gamepad2 className="mr-2 size-4" />
            <span>CS2 Tracker</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+C</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="⚙️ Система">
          <CommandItem onSelect={() => handleSelect('import')}>
            <Download className="mr-2 size-4" />
            <span>Импорт/Экспорт</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
