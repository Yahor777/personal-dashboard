import { useState, useEffect } from 'react';
import { Menu, Loader2 } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { Button } from './components/ui/button';
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
import { database, auth } from './config/firebase';
import { ref, onValue, set } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import type { Card } from './types';

export default function App() {
  const { workspace, currentTabId, setCurrentTab, authState, register, login } = useStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showOLXSearch, setShowOLXSearch] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Handle Google Sign-In
  const handleGoogleLogin = (googleUser: any) => {
    // Create user from Google data
    const user = {
      id: googleUser.uid,
      email: googleUser.email || 'google-user@gmail.com',
      name: googleUser.displayName || 'Google User',
      avatar: googleUser.photoURL,
      createdAt: new Date().toISOString(),
    };

    // Set authenticated state
    useStore.setState({
      authState: {
        isAuthenticated: true,
        currentUser: user,
      },
    });

    // Load user's workspace from localStorage
    const savedWorkspace = localStorage.getItem(`dashboard-workspace-${user.id}`);
    if (savedWorkspace) {
      try {
        const workspace = JSON.parse(savedWorkspace);
        useStore.setState({ workspace });
      } catch (error) {
        console.error('Failed to load workspace:', error);
      }
    }
  };

  // Check Firebase auth state on mount (prevents black screen flicker)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        handleGoogleLogin({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      }
      // Auth check complete
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-save workspace for current user (localStorage + Firebase sync)
  useEffect(() => {
    if (authState.currentUser && authState.isAuthenticated) {
      const saveTimer = setTimeout(() => {
        // Save to localStorage (offline backup)
        localStorage.setItem(
          `dashboard-workspace-${authState.currentUser!.id}`,
          JSON.stringify(workspace)
        );
        
        // Sync to Firebase (cross-device sync)
        const userWorkspaceRef = ref(database, `workspaces/${authState.currentUser!.id}`);
        set(userWorkspaceRef, {
          ...workspace,
          lastModified: new Date().toISOString(),
        }).catch((error) => {
          console.error('Failed to sync to Firebase:', error);
        });
      }, 500);
      return () => clearTimeout(saveTimer);
    }
  }, [workspace, authState]);

  // Listen for Firebase updates (real-time sync from other devices)
  useEffect(() => {
    if (authState.currentUser && authState.isAuthenticated) {
      const userWorkspaceRef = ref(database, `workspaces/${authState.currentUser!.id}`);
      
      const unsubscribe = onValue(userWorkspaceRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.lastModified) {
          // Check if remote data is newer than local
          const localData = localStorage.getItem(`dashboard-workspace-${authState.currentUser!.id}`);
          let shouldUpdate = true;
          
          if (localData) {
            try {
              const local = JSON.parse(localData);
              const localTime = new Date(local.lastModified || 0).getTime();
              const remoteTime = new Date(data.lastModified).getTime();
              
              // Only update if remote is newer (avoid sync loops)
              shouldUpdate = remoteTime > localTime;
            } catch (error) {
              console.error('Failed to parse local data:', error);
            }
          }
          
          if (shouldUpdate) {
            console.log('Syncing workspace from Firebase...');
            useStore.setState({ workspace: data });
            localStorage.setItem(
              `dashboard-workspace-${authState.currentUser!.id}`,
              JSON.stringify(data)
            );
          }
        }
      });
      
      return () => unsubscribe();
    }
  }, [authState]);

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

      // Ctrl+K or Cmd+K - Open OLX search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowOLXSearch(true);
        setShowAI(false);
        setShowSettings(false);
        setShowImportExport(false);
        setShowAnalytics(false);
      }

      // Ctrl+/ or Cmd+/ - Open AI assistant
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowAI(true);
        setShowOLXSearch(false);
        setShowSettings(false);
        setShowImportExport(false);
        setShowAnalytics(false);
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

  // Show loading screen while checking auth state
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Show login/register modal if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <>
        <LoginRegisterModal 
          onLogin={login} 
          onRegister={register}
          onGoogleLogin={handleGoogleLogin}
        />
        <Toaster />
      </>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar
          onOpenSettings={() => {
            setShowSettings(true);
            setShowImportExport(false);
            setShowAnalytics(false);
            setShowAI(false);
            setShowOLXSearch(false);
          }}
          onOpenImportExport={() => {
            setShowImportExport(true);
            setShowSettings(false);
            setShowAnalytics(false);
            setShowAI(false);
            setShowOLXSearch(false);
          }}
          onOpenAnalytics={() => {
            setShowAnalytics(true);
            setShowSettings(false);
            setShowImportExport(false);
            setShowAI(false);
            setShowOLXSearch(false);
          }}
          onOpenAI={() => {
            setShowOLXSearch(false);
            setShowAnalytics(false);
            setShowImportExport(false);
            setShowSettings(false);
            setShowAI(true);
          }}
          onOpenOLXSearch={() => {
            setShowAI(false);
            setShowAnalytics(false);
            setShowImportExport(false);
            setShowSettings(false);
            setShowOLXSearch(true);
          }}
        />

        <main className="flex flex-1 flex-col overflow-y-auto md:overflow-hidden">
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2 border-b border-border bg-background px-4 py-3">
            <SidebarTrigger className="hover:bg-accent rounded-md">
              <Menu className="size-5" />
            </SidebarTrigger>
            <h2 className="flex-1 font-semibold">{workspace.name}</h2>
          </div>

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
            <KanbanBoard 
              tabId={currentTab.id} 
              onCardClick={(card) => {
                setSelectedCard(card);
                // Auto-close all panels when opening a card
                setShowSettings(false);
                setShowImportExport(false);
                setShowAnalytics(false);
                setShowAI(false);
                setShowOLXSearch(false);
              }} 
            />
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