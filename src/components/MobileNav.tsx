import { useEffect, useState } from 'react';
import { Home, Search, Bot, Settings as SettingsIcon } from 'lucide-react';
import { Button } from './ui/button';

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
      setIsMobile('matches' in event ? event.matches : (event as MediaQueryList).matches);
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

  const title = currentTab === 'olx' ? 'OLX Поиск' : currentTab === 'ai' ? 'AI Ассистент' : 'Dashboard';

  return (
    <>
      {/* Mobile Header убран по просьбе пользователя */}

      {/* Mobile Bottom Navigation - Only on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="flex justify-around gap-1 p-1.5 pb-safe">
          <Button
            aria-label="Открыть Dashboard"
            variant={currentTab === 'dashboard' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onTabChange('dashboard')}
          >
            <Home className="size-5" />
          </Button>

          <Button
            aria-label="Открыть OLX поиск"
            variant={currentTab === 'olx' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => {
              onTabChange('olx');
              onOpenOLX?.();
            }}
          >
            <Search className="size-5" />
          </Button>

          <Button
            aria-label="Открыть AI ассистент"
            variant={currentTab === 'ai' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => {
              onTabChange('ai');
              onOpenAI?.();
            }}
          >
            <Bot className="size-5" />
          </Button>
        </div>
      </div>
    </>
  );
}
