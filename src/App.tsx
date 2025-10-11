import { useState, useEffect } from 'react';
import { SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/AppSidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { CardDrawer } from './components/CardDrawer';
import { SettingsPanel } from './components/SettingsPanel';
import { ImportExportPanel } from './components/ImportExportPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { OLXSearchPanel } from './components/OLXSearchPanel';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { LoginRegisterModal } from './components/LoginRegisterModal';
import { EmptyState } from './components/EmptyState';
import { Toaster } from './components/ui/sonner';
import { useStore } from './store/useStore';
import type { Card } from './types';

export default function App() {
  const { workspace, currentTabId, setCurrentTab, authState, register, login } = useStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showOLXSearch, setShowOLXSearch] = useState(false);

  // Set initial theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'neon', 'minimal');
    
    if (workspace.settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (workspace.settings.theme === 'neon') {
      root.classList.add('dark', 'neon');
    } else if (workspace.settings.theme === 'minimal') {
      root.classList.add('minimal');
    }
  }, [workspace.settings.theme]);

  // Set initial tab if none selected
  useEffect(() => {
    if (!currentTabId && workspace.tabs.length > 0) {
      setCurrentTab(workspace.tabs[0].id);
    }
  }, [currentTabId, workspace.tabs, setCurrentTab]);

  const currentTab = workspace.tabs.find((tab) => tab.id === currentTabId);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // N - New card (when a tab is selected)
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && currentTabId && currentTab) {
        const firstColumn = currentTab.columns[0];
        if (firstColumn) {
          useStore.getState().addCard({
            title: 'Новая карточка',
            description: '',
            type: 'task',
            priority: 'medium',
            tags: [],
            reminders: [],
            attachments: [],
            images: [],
            checklist: [],
            comments: [],
            columnId: firstColumn.id,
          });
        }
      }
      // Escape - Close panels
      if (e.key === 'Escape') {
        setSelectedCard(null);
        setShowSettings(false);
        setShowImportExport(false);
        setShowAnalytics(false);
        setShowAI(false);
        setShowOLXSearch(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTabId, currentTab]);

  // Show login/register modal if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <>
        <LoginRegisterModal onLogin={login} onRegister={register} />
        <Toaster />
      </>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar
          onOpenSettings={() => setShowSettings(true)}
          onOpenImportExport={() => setShowImportExport(true)}
          onOpenAnalytics={() => setShowAnalytics(true)}
          onOpenAI={() => setShowAI(true)}
          onOpenOLXSearch={() => setShowOLXSearch(true)}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Welcome Header */}
          {workspace.settings.userName && (
            <div className="border-b border-border bg-gradient-to-r from-primary/5 to-accent/20 px-6 py-4">
              <h1 className="text-foreground">
                Привет, {workspace.settings.userName} 👋
              </h1>
              <p className="text-muted-foreground">
                У тебя{' '}
                {workspace.cards.filter(
                  (c) =>
                    !workspace.tabs
                      .find((t) => t.columns.some((col) => col.id === c.columnId))
                      ?.columns.find((col) => col.id === c.columnId)
                      ?.title.toLowerCase()
                      .includes('done')
                ).length}{' '}
                активных задач
              </p>
            </div>
          )}

          {currentTab ? (
            <KanbanBoard tabId={currentTab.id} onCardClick={setSelectedCard} />
          ) : (
            <EmptyState
              title="Нет вкладок"
              description="Создайте первую вкладку, чтобы начать работу с карточками и задачами."
              actionLabel="Создать вкладку"
              onAction={() => {}}
            />
          )}
        </main>

        {/* Overlays & Panels */}
        <OnboardingOverlay />
        
        {selectedCard && (
          <CardDrawer
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}

        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        {showImportExport && <ImportExportPanel onClose={() => setShowImportExport(false)} />}
        {showAnalytics && <AnalyticsPanel onClose={() => setShowAnalytics(false)} />}
        {showAI && <AIAssistantPanel onClose={() => setShowAI(false)} />}
        {showOLXSearch && <OLXSearchPanel onClose={() => setShowOLXSearch(false)} />}

        <Toaster />
      </div>
    </SidebarProvider>
  );
}