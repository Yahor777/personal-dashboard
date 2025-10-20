import { useEffect, useState } from 'react';
import { Home, Search, Bot, Settings as SettingsIcon, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

interface MobileNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenSettings?: () => void;
  onOpenOLX?: () => void;
  onOpenAI?: () => void;
}

export function MobileNav({ currentTab, onTabChange, onOpenSettings, onOpenOLX, onOpenAI }: MobileNavProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handler = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handler(mediaQuery);
    mediaQuery.addEventListener('change', handler as (e: MediaQueryListEvent) => void);

    return () => {
      mediaQuery.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
    };
  }, []);

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Mobile Header - Only on Mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-lg pt-safe">
        <div className="flex items-center justify-between p-3">
          <h1 className="text-base font-bold text-foreground">Dashboard</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Меню</h2>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" className="justify-start" onClick={() => onTabChange('dashboard')}>
                    <Home className="mr-2 size-4" /> Главная
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => { onOpenOLX?.(); onTabChange('olx'); }}>
                    <Search className="mr-2 size-4" /> OLX Поиск
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => { onOpenAI?.(); onTabChange('ai'); }}>
                    <Bot className="mr-2 size-4" /> AI Ассистент
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={onOpenSettings}>
                    <SettingsIcon className="mr-2 size-4" /> Настройки
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Only on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="grid grid-cols-4 gap-1 p-1.5 pb-safe">
          <Button
            variant={currentTab === 'dashboard' ? 'default' : 'ghost'}
            className="flex flex-col h-16 gap-1"
            onClick={() => onTabChange('dashboard')}
          >
            <Home className="size-5" />
            <span className="text-xs">Главная</span>
          </Button>
          
          <Button
            variant={currentTab === 'olx' ? 'default' : 'ghost'}
            className="flex flex-col h-16 gap-1"
            onClick={() => onTabChange('olx')}
          >
            <Search className="size-5" />
            <span className="text-xs">OLX</span>
          </Button>
          
          <Button
            variant={currentTab === 'ai' ? 'default' : 'ghost'}
            className="flex flex-col h-16 gap-1"
            onClick={() => onTabChange('ai')}
          >
            <Bot className="size-5" />
            <span className="text-xs">AI</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col h-16 gap-1"
            onClick={onOpenSettings}
          >
            <SettingsIcon className="size-5" />
            <span className="text-xs">Ещё</span>
          </Button>
        </div>
      </div>
    </>
  );
}
