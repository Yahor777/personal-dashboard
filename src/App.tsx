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
import { PCBuildCalculator } from './components/PCBuildCalculator';
import { PythonTracker } from './components/PythonTracker';
import { CS2GameTracker } from './components/CS2GameTracker';
import { QuickNavigation } from './components/QuickNavigation';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { LoginRegisterModal } from './components/LoginRegisterModal';
import { EmptyState } from './components/EmptyState';
import { MobileNav } from './components/MobileNav';
import { Toaster } from './components/ui/sonner';
import { useStore } from './store/useStore';
import { database, auth } from './config/firebase';
import { ref, onValue, set } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import type { Card } from './types';
import DemoPage from './app/page';
import AppHeader from './components/AppHeader';
import { Suspense, lazy } from 'react';
import { useScrollRestoration, attachSmoothScrollLinks } from "./utils/scroll";

// Lazy-loaded panels (remove heavy imports from initial bundle)
const SettingsPanelLazy = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const ImportExportPanelLazy = lazy(() => import('./components/ImportExportPanel').then(m => ({ default: m.ImportExportPanel })));
const AnalyticsPanelLazy = lazy(() => import('./components/AnalyticsPanel').then(m => ({ default: m.AnalyticsPanel })));
const AIAssistantPanelLazy = lazy(() => import('./components/AIAssistantPanel').then(m => ({ default: m.AIAssistantPanel })));
const OLXSearchPanelLazy = lazy(() => import('./components/OLXSearchPanel').then(m => ({ default: m.OLXSearchPanel })));
const PCBuildCalculatorLazy = lazy(() => import('./components/PCBuildCalculator').then(m => ({ default: m.PCBuildCalculator })));
const PythonTrackerLazy = lazy(() => import('./components/PythonTracker').then(m => ({ default: m.PythonTracker })));
const CS2GameTrackerLazy = lazy(() => import('./components/CS2GameTracker').then(m => ({ default: m.CS2GameTracker })));

export default function App() {
  const { workspace, currentTabId, setCurrentTab, authState, register, login } = useStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showOLXSearch, setShowOLXSearch] = useState(false);
  const [showPCBuilder, setShowPCBuilder] = useState(false);
  const [showPythonLearning, setShowPythonLearning] = useState(false);
  const [showCS2Tracker, setShowCS2Tracker] = useState(false);
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
        // Validate workspace structure
        if (!workspace.tabs) workspace.tabs = [];
        if (!workspace.cards) workspace.cards = [];
        if (!workspace.settings) workspace.settings = {};
        
        // Clean up cards data - ensure all arrays are initialized
        workspace.cards = (workspace.cards || []).map((card: any) => ({
          ...card,
          tags: card.tags || [],
          checklist: card.checklist || [],
          comments: card.comments || [],
          images: card.images || [],
          attachments: card.attachments || [],
          reminders: card.reminders || [],
        }));
        
        useStore.setState({ workspace });
      } catch (error) {
        console.error('Failed to load workspace:', error);
      }
    }
  };

  // Check Firebase auth state on mount (prevents black screen flicker)
  useEffect(() => {
    console.log('🔥 Инициализация Firebase Auth...');
    console.log('Firebase Auth URL:', auth.config.apiHost);
    console.log('Firebase Project ID:', auth.config.apiKey.substring(0, 10) + '...');

    // Guest mode: skip auth entirely if flag set
    if (import.meta.env.VITE_DISABLE_AUTH === 'true') {
      useStore.setState({
        authState: {
          isAuthenticated: true,
          currentUser: {
            id: 'guest',
            email: 'guest@example.com',
            name: 'Guest',
            avatar: null,
            createdAt: new Date().toISOString(),
          },
        },
      });
      setIsAuthLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        console.log('✅ Пользователь вошёл:', firebaseUser.email);
        handleGoogleLogin({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        // User is signed out - reset auth state
        console.log('❌ Пользователь не авторизован');
        useStore.setState({
          authState: {
            isAuthenticated: false,
            currentUser: null,
          },
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
          // Validate workspace data structure
          if (!data.tabs) data.tabs = [];
          if (!data.cards) data.cards = [];
          if (!data.settings) data.settings = {};
          
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
            
            // Clean up cards data - ensure all arrays are initialized
            const cleanedData = {
              ...data,
              cards: (data.cards || []).map((card: any) => ({
                ...card,
                tags: card.tags || [],
                checklist: card.checklist || [],
                comments: card.comments || [],
                images: card.images || [],
                attachments: card.attachments || [],
                reminders: card.reminders || [],
              })),
            };
            
            useStore.setState({ workspace: cleanedData });
            localStorage.setItem(
              `dashboard-workspace-${authState.currentUser!.id}`,
              JSON.stringify(cleanedData)
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
    if (!currentTabId && workspace.tabs && workspace.tabs.length > 0) {
      setCurrentTab(workspace.tabs[0].id);
    }
  }, [currentTabId, workspace.tabs, setCurrentTab]);

  // Initialize smooth scrolling links and scroll restoration
  useEffect(() => {
    useScrollRestoration();
    attachSmoothScrollLinks();
  }, []);

  const currentTab = workspace.tabs?.find((tab) => tab.id === currentTabId);

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

  // Маршрут демо для Aceternity + shadcn (без авторизации)
  if (typeof window !== 'undefined' && window.location.hash === '#/demo') {
    return <DemoPage />;
  }

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

  // Handle quick navigation
  const handleQuickNavigate = (page: string) => {
    // Close all panels first
    setShowSettings(false);
    setShowImportExport(false);
    setShowAnalytics(false);
    setShowAI(false);
    setShowOLXSearch(false);
    setShowPCBuilder(false);
    setShowPythonLearning(false);
    setShowCS2Tracker(false);
    
    // Open the requested page
    switch (page) {
      case 'settings': setShowSettings(true); break;
      case 'analytics': setShowAnalytics(true); break;
      case 'ai': setShowAI(true); break;
      case 'olx': setShowOLXSearch(true); break;
      case 'pcbuilder': setShowPCBuilder(true); break;
      case 'python': setShowPythonLearning(true); break;
      case 'cs2': setShowCS2Tracker(true); break;
      case 'import': setShowImportExport(true); break;
    }
  };

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
        {/* Mobile Navigation */}
        <MobileNav
          currentTab={showOLXSearch ? 'olx' : showAI ? 'ai' : 'dashboard'}
          onTabChange={(tab) => {
            if (tab === 'dashboard') {
              setShowOLXSearch(false);
              setShowAI(false);
              setShowSettings(false);
            } else if (tab === 'olx') {
              setShowOLXSearch(true);
              setShowAI(false);
              setShowSettings(false);
            } else if (tab === 'ai') {
              setShowAI(true);
              setShowOLXSearch(false);
              setShowSettings(false);
            }
          }}
          onOpenSettings={() => setShowSettings(true)}
          onOpenOLX={() => setShowOLXSearch(true)}
          onOpenAI={() => setShowAI(true)}
        />

        {/* Desktop Header */}
        <div className="hidden md:block w-full">
          <AppHeader />
        </div>

        {/* Desktop Sidebar (Hidden on Mobile) */}
        <div className="hidden md:block">
        <AppSidebar
          onOpenSettings={() => {
            setShowSettings(true);
            setShowImportExport(false);
            setShowAnalytics(false);
            setShowAI(false);
            setShowOLXSearch(false);
            setShowPCBuilder(false);
            setShowPythonLearning(false);
            setShowCS2Tracker(false);
          }}
          onOpenImportExport={() => {
            setShowImportExport(true);
            setShowSettings(false);
            setShowAnalytics(false);
            setShowAI(false);
            setShowOLXSearch(false);
            setShowPCBuilder(false);
            setShowPythonLearning(false);
            setShowCS2Tracker(false);
          }}
          onOpenAnalytics={() => {
            setShowAnalytics(true);
            setShowSettings(false);
            setShowImportExport(false);
            setShowAI(false);
            setShowOLXSearch(false);
            setShowPCBuilder(false);
            setShowPythonLearning(false);
            setShowCS2Tracker(false);
          }}
          onOpenAI={() => {
            setShowAI(true);
            setShowAnalytics(false);
            setShowImportExport(false);
            setShowSettings(false);
            setShowOLXSearch(false);
            setShowPCBuilder(false);
            setShowPythonLearning(false);
            setShowCS2Tracker(false);
          }}
          onOpenOLXSearch={() => {
            setShowAI(false);
            setShowAnalytics(false);
            setShowImportExport(false);
            setShowSettings(false);
            setShowOLXSearch(true);
            setShowPCBuilder(false);
            setShowPythonLearning(false);
            setShowCS2Tracker(false);
          }}
          onOpenPCBuilder={() => {
            setShowAI(false);
            setShowAnalytics(false);
            setShowImportExport(false);
            setShowSettings(false);
            setShowOLXSearch(false);
            setShowPCBuilder(true);
            setShowPythonLearning(false);
            setShowCS2Tracker(false);
          }}
          onOpenPythonLearning={() => {
            setShowAI(false);
            setShowAnalytics(false);
            setShowImportExport(false);
            setShowSettings(false);
            setShowOLXSearch(false);
            setShowPCBuilder(false);
            setShowPythonLearning(true);
            setShowCS2Tracker(false);
          }}
          onOpenCS2Tracker={() => {
            setShowAI(false);
            setShowAnalytics(false);
            setShowImportExport(false);
            setShowSettings(false);
            setShowOLXSearch(false);
            setShowPCBuilder(false);
            setShowPythonLearning(false);
            setShowCS2Tracker(true);
          }}
        />
        </div>

        <main className="flex flex-1 flex-col overflow-y-auto md:overflow-hidden pt-14 pb-bottom-nav md:pt-0 md:pb-0">
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
        <QuickNavigation onNavigate={handleQuickNavigate} />
        <OnboardingOverlay />
        
        {selectedCard && (
          <CardDrawer
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}

        {showSettings && (
          <Suspense fallback={<div className="p-4">Загрузка настроек...</div>}>
            <SettingsPanelLazy onClose={() => setShowSettings(false)} />
          </Suspense>
        )}
        {showImportExport && (
          <Suspense fallback={<div className="p-4">Загрузка импорта/экспорта...</div>}>
            <ImportExportPanelLazy onClose={() => setShowImportExport(false)} />
          </Suspense>
        )}
        {showAnalytics && (
          <Suspense fallback={<div className="p-4">Загрузка аналитики...</div>}>
            <AnalyticsPanelLazy onClose={() => setShowAnalytics(false)} />
          </Suspense>
        )}
        {showAI && (
          <Suspense fallback={<div className="p-4">Загрузка AI ассистента...</div>}>
            <AIAssistantPanelLazy onClose={() => setShowAI(false)} />
          </Suspense>
        )}
        {showOLXSearch && (
          <Suspense fallback={<div className="p-4">Загрузка поиска OLX...</div>}>
            <OLXSearchPanelLazy onClose={() => setShowOLXSearch(false)} />
          </Suspense>
        )}
        {/* OLXMarketplace temporarily disabled for refactor */}
        {showPCBuilder && (
          <Suspense fallback={<div className="p-4">Загрузка калькулятора ПК...</div>}>
            <PCBuildCalculatorLazy onClose={() => setShowPCBuilder(false)} />
          </Suspense>
        )}
        {showPythonLearning && (
          <Suspense fallback={<div className="p-4">Загрузка Python панели...</div>}>
            <PythonTrackerLazy onClose={() => setShowPythonLearning(false)} />
          </Suspense>
        )}
        {showCS2Tracker && (
          <Suspense fallback={<div className="p-4">Загрузка CS2 трекера...</div>}>
            <CS2GameTrackerLazy onClose={() => setShowCS2Tracker(false)} />
          </Suspense>
        )}

        <Toaster />
      </div>
    </SidebarProvider>
  );
}