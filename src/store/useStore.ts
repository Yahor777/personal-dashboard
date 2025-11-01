// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Workspace, Tab, Card, Column, TabTemplate, Priority, CardType, User } from '../types';
import { defaultWorkspace } from '../data/defaultData';

interface StoreActions {
  // Workspace
  updateWorkspaceName: (name: string) => void;
  importWorkspace: (workspace: Workspace) => void;
  resetWorkspace: () => void;
  
  // Tabs
  addTab: (title: string, template: TabTemplate) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  deleteTab: (tabId: string) => void;
  setCurrentTab: (tabId: string) => void;
  reorderTabs: (tabIds: string[]) => void;
  
  // Columns
  addColumn: (tabId: string, title: string) => void;
  updateColumn: (tabId: string, columnId: string, title: string) => void;
  deleteColumn: (tabId: string, columnId: string) => void;
  reorderColumns: (tabId: string, columnIds: string[]) => void;
  
  // Cards
  addCard: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  deleteCard: (cardId: string) => void;
  moveCard: (cardId: string, targetColumnId: string, newOrder: number) => void;
  duplicateCard: (cardId: string) => void;
  completeCard: (cardId: string) => void;
  addImageToCard: (cardId: string, image: Omit<import('../types').CardImage, 'id' | 'uploadedAt'>) => void;
  removeImageFromCard: (cardId: string, imageId: string) => void;
  updateCardImage: (cardId: string, imageId: string, updates: Partial<import('../types').CardImage>) => void;
  
  // Search & Filter
  setSearchQuery: (query: string) => void;
  setFilterTags: (tags: string[]) => void;
  setFilterPriority: (priorities: Priority[]) => void;
  clearFilters: () => void;
  
  // Settings
  updateSettings: (settings: Partial<AppState['workspace']['settings']>) => void;
  
  // Analytics
  getAnalytics: () => any;
  
  // AI Assistant
  createAIConversation: (title: string) => string;
  addAIMessage: (conversationId: string, message: { role: 'user' | 'assistant'; content: string }) => void;
  deleteAIConversation: (conversationId: string) => void;
  setCurrentConversation: (conversationId: string | null) => void;
  updateConversationTitle: (conversationId: string, title: string) => void;
  
  // Auth
  register: (name: string, email: string, password: string) => boolean;
  login: (email: string, password: string) => boolean;
  logout: () => Promise<void>;
}

type Store = AppState & StoreActions;

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createDefaultColumns = (template: TabTemplate): Column[] => {
  const templates: Record<TabTemplate, Array<{ title: string; order: number }>> = {
    school: [
      { title: 'To Study', order: 0 },
      { title: 'In Progress', order: 1 },
      { title: 'Completed', order: 2 },
    ],
    cooking: [
      { title: 'Recipes to Try', order: 0 },
      { title: 'Shopping List', order: 1 },
      { title: 'Cooked', order: 2 },
    ],
    personal: [
      { title: 'Ideas', order: 0 },
      { title: 'In Progress', order: 1 },
      { title: 'Done', order: 2 },
    ],
    blank: [
      { title: 'To Do', order: 0 },
      { title: 'In Progress', order: 1 },
      { title: 'Done', order: 2 },
    ],
    'pc-repair': [
      { title: 'Диагностика', order: 0 },
      { title: 'В ремонте', order: 1 },
      { title: 'Готово', order: 2 },
    ],
    marketplace: [
      { title: 'На продажу', order: 0 },
      { title: 'Активные', order: 1 },
      { title: 'Продано', order: 2 },
    ],
  };

  return templates[template].map((col) => ({
    id: generateId(),
    title: col.title,
    order: col.order,
    cardIds: [],
  }));
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      workspace: defaultWorkspace,
      currentTabId: null,
      searchQuery: '',
      filterTags: [],
      filterPriority: [],
      aiConversations: [],
      currentConversationId: null,
      authState: {
        isAuthenticated: false,
        currentUser: null,
      },

      // Workspace
      updateWorkspaceName: (name) =>
        set((state) => ({
          workspace: { ...state.workspace, name, updatedAt: new Date().toISOString() },
        })),

      importWorkspace: (workspace) =>
        set({
          workspace: { ...workspace, updatedAt: new Date().toISOString() },
          currentTabId: workspace.tabs[0]?.id || null,
        }),

      resetWorkspace: () =>
        set({
          workspace: defaultWorkspace,
          currentTabId: defaultWorkspace.tabs[0]?.id || null,
          searchQuery: '',
          filterTags: [],
          filterPriority: [],
        }),

      // Tabs
      addTab: (title, template) =>
        set((state) => {
          const newTab: Tab = {
            id: generateId(),
            title,
            template,
            columns: createDefaultColumns(template),
            createdAt: new Date().toISOString(),
            order: state.workspace.tabs.length,
          };
          return {
            workspace: {
              ...state.workspace,
              tabs: [...state.workspace.tabs, newTab],
              updatedAt: new Date().toISOString(),
            },
            currentTabId: newTab.id,
          };
        }),

      updateTab: (tabId, updates) =>
        set((state) => ({
          workspace: {
            ...state.workspace,
            tabs: state.workspace.tabs.map((tab) =>
              tab.id === tabId ? { ...tab, ...updates } : tab
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteTab: (tabId) =>
        set((state) => {
          const tabs = state.workspace.tabs.filter((tab) => tab.id !== tabId);
          const cards = state.workspace.cards.filter((card) => {
            const tab = state.workspace.tabs.find((t) => t.id === tabId);
            return !tab?.columns.some((col) => col.id === card.columnId);
          });
          
          return {
            workspace: {
              ...state.workspace,
              tabs,
              cards,
              updatedAt: new Date().toISOString(),
            },
            currentTabId: state.currentTabId === tabId ? (tabs[0]?.id || null) : state.currentTabId,
          };
        }),

      setCurrentTab: (tabId) => set({ currentTabId: tabId }),

      reorderTabs: (tabIds) =>
        set((state) => {
          const tabs = tabIds.map((id, index) => {
            const tab = state.workspace.tabs.find((t) => t.id === id);
            return tab ? { ...tab, order: index } : null;
          }).filter(Boolean) as Tab[];
          
          return {
            workspace: {
              ...state.workspace,
              tabs,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      // Columns
      addColumn: (tabId, title) =>
        set((state) => ({
          workspace: {
            ...state.workspace,
            tabs: state.workspace.tabs.map((tab) => {
              if (tab.id === tabId) {
                const newColumn: Column = {
                  id: generateId(),
                  title,
                  order: tab.columns.length,
                  cardIds: [],
                };
                return { ...tab, columns: [...tab.columns, newColumn] };
              }
              return tab;
            }),
            updatedAt: new Date().toISOString(),
          },
        })),

      updateColumn: (tabId, columnId, title) =>
        set((state) => ({
          workspace: {
            ...state.workspace,
            tabs: state.workspace.tabs.map((tab) => {
              if (tab.id === tabId) {
                return {
                  ...tab,
                  columns: tab.columns.map((col) =>
                    col.id === columnId ? { ...col, title } : col
                  ),
                };
              }
              return tab;
            }),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteColumn: (tabId, columnId) =>
        set((state) => {
          // Delete cards in this column
          const cards = state.workspace.cards.filter((card) => card.columnId !== columnId);
          
          return {
            workspace: {
              ...state.workspace,
              tabs: state.workspace.tabs.map((tab) => {
                if (tab.id === tabId) {
                  return {
                    ...tab,
                    columns: tab.columns.filter((col) => col.id !== columnId),
                  };
                }
                return tab;
              }),
              cards,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      reorderColumns: (tabId, columnIds) =>
        set((state) => ({
          workspace: {
            ...state.workspace,
            tabs: state.workspace.tabs.map((tab) => {
              if (tab.id === tabId) {
                const columns = columnIds.map((id, index) => {
                  const col = tab.columns.find((c) => c.id === id);
                  return col ? { ...col, order: index } : null;
                }).filter(Boolean) as Column[];
                return { ...tab, columns };
              }
              return tab;
            }),
            updatedAt: new Date().toISOString(),
          },
        })),

      // Cards
      addCard: (cardData) =>
        set((state) => {
          const newCard: Card = {
            ...cardData,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: state.workspace.cards.filter((c) => c.columnId === cardData.columnId).length,
          };
          
          return {
            workspace: {
              ...state.workspace,
              cards: [...state.workspace.cards, newCard],
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      updateCard: (cardId, updates) =>
        set((state) => ({
          workspace: {
            ...state.workspace,
            cards: state.workspace.cards.map((card) =>
              card.id === cardId
                ? { ...card, ...updates, updatedAt: new Date().toISOString() }
                : card
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteCard: (cardId) =>
        set((state) => ({
          workspace: {
            ...state.workspace,
            cards: state.workspace.cards.filter((card) => card.id !== cardId),
            updatedAt: new Date().toISOString(),
          },
        })),

      moveCard: (cardId, targetColumnId, newOrder) =>
        set((state) => {
          const card = state.workspace.cards.find((c) => c.id === cardId);
          if (!card) return state;

          const sourceColumnId = card.columnId;
          let cards = [...state.workspace.cards];

          // Update the moved card
          cards = cards.map((c) =>
            c.id === cardId
              ? { ...c, columnId: targetColumnId, order: newOrder, updatedAt: new Date().toISOString() }
              : c
          );

          // Reorder cards in source column
          if (sourceColumnId !== targetColumnId) {
            cards = cards.map((c) => {
              if (c.columnId === sourceColumnId && c.order > card.order) {
                return { ...c, order: c.order - 1 };
              }
              return c;
            });
          }

          // Reorder cards in target column
          cards = cards.map((c) => {
            if (c.columnId === targetColumnId && c.id !== cardId && c.order >= newOrder) {
              return { ...c, order: c.order + 1 };
            }
            return c;
          });

          return {
            workspace: {
              ...state.workspace,
              cards,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      duplicateCard: (cardId) =>
        set((state) => {
          const card = state.workspace.cards.find((c) => c.id === cardId);
          if (!card) return state;

          const newCard: Card = {
            ...card,
            id: generateId(),
            title: `${card.title} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: state.workspace.cards.filter((c) => c.columnId === card.columnId).length,
          };

          return {
            workspace: {
              ...state.workspace,
              cards: [...state.workspace.cards, newCard],
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      completeCard: (cardId) =>
        set((state) => {
          const card = state.workspace.cards.find((c) => c.id === cardId);
          if (!card) return state;

          // Find "Done" or "Completed" column
          const currentTab = state.workspace.tabs.find((tab) =>
            tab.columns.some((col) => col.id === card.columnId)
          );
          
          if (!currentTab) return state;

          const doneColumn = currentTab.columns.find(
            (col) => col.title.toLowerCase().includes('done') || col.title.toLowerCase().includes('completed')
          ) || currentTab.columns[currentTab.columns.length - 1];

          if (doneColumn.id === card.columnId) return state;

          const newOrder = state.workspace.cards.filter((c) => c.columnId === doneColumn.id).length;
          
          return {
            workspace: {
              ...state.workspace,
              cards: state.workspace.cards.map((c) =>
                c.id === cardId
                  ? { ...c, columnId: doneColumn.id, order: newOrder, updatedAt: new Date().toISOString() }
                  : c
              ),
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      // Search & Filter
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterTags: (tags) => set({ filterTags: tags }),
      setFilterPriority: (priorities) => set({ filterPriority: priorities }),
      clearFilters: () => set({ searchQuery: '', filterTags: [], filterPriority: [] }),

      // Settings
      updateSettings: (settings) =>
        set((state) => ({
          workspace: {
            ...state.workspace,
            settings: { ...state.workspace.settings, ...settings },
            updatedAt: new Date().toISOString(),
          },
        })),

      // Analytics
      getAnalytics: () => {
        const state = get();
        const cards = state.workspace.cards;
        
        const completedCards = cards.filter((card) => {
          const tab = state.workspace.tabs.find((t) =>
            t.columns.some((col) => col.id === card.columnId)
          );
          const column = tab?.columns.find((col) => col.id === card.columnId);
          return column?.title.toLowerCase().includes('done') || column?.title.toLowerCase().includes('completed');
        }).length;

        const timeByTab: Record<string, number> = {};
        state.workspace.tabs.forEach((tab) => {
          const tabCards = cards.filter((card) =>
            tab.columns.some((col) => col.id === card.columnId)
          );
          timeByTab[tab.title] = tabCards.reduce((sum, card) => sum + (card.timeSpent || 0), 0);
        });

        return {
          totalCards: cards.length,
          completedCards,
          timeByTab,
          completionRate: cards.length > 0 ? (completedCards / cards.length) * 100 : 0,
        };
      },

      // AI Assistant
      createAIConversation: (title) => {
        const id = generateId();
        set((state) => ({
          aiConversations: [
            ...state.aiConversations,
            {
              id,
              title,
              messages: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          currentConversationId: id,
        }));
        return id;
      },

      addAIMessage: (conversationId, message) =>
        set((state) => ({
          aiConversations: state.aiConversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [
                    ...conv.messages,
                    {
                      id: generateId(),
                      role: message.role,
                      content: message.content,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : conv
          ),
        })),

      deleteAIConversation: (conversationId) =>
        set((state) => ({
          aiConversations: state.aiConversations.filter((conv) => conv.id !== conversationId),
          currentConversationId:
            state.currentConversationId === conversationId ? null : state.currentConversationId,
        })),

      setCurrentConversation: (conversationId) =>
        set({ currentConversationId: conversationId }),

      updateConversationTitle: (conversationId, title) =>
        set((state) => ({
          aiConversations: state.aiConversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, title, updatedAt: new Date().toISOString() }
              : conv
          ),
        })),

      // Card Images
      addImageToCard: (cardId, image) =>
        set((state) => ({
          workspace: {
            ...state.workspace,
            cards: state.workspace.cards.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    images: [
                      ...card.images,
                      {
                        ...image,
                        id: generateId(),
                        uploadedAt: new Date().toISOString(),
                      },
                    ],
                    updatedAt: new Date().toISOString(),
                  }
                : card
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      removeImageFromCard: (cardId, imageId) =>
        set((state) => ({
          workspace: {
            ...state.workspace,
            cards: state.workspace.cards.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    images: card.images.filter((img) => img.id !== imageId),
                    updatedAt: new Date().toISOString(),
                  }
                : card
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      updateCardImage: (cardId, imageId, updates) =>
        set((state) => ({
          workspace: {
            ...state.workspace,
            cards: state.workspace.cards.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    images: card.images.map((img) =>
                      img.id === imageId ? { ...img, ...updates } : img
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : card
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      // Auth methods
      register: (name, email, password) => {
        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('dashboard-users') || '[]');
        if (users.some((u: any) => u.email === email)) {
          return false;
        }

        // Create new user
        const newUser: User = {
          id: generateId(),
          email,
          name,
          createdAt: new Date().toISOString(),
        };

        // Hash password (simple encoding for demo)
        const hashedPassword = btoa(password);
        users.push({ ...newUser, password: hashedPassword });
        localStorage.setItem('dashboard-users', JSON.stringify(users));

        // Create user workspace
        const userWorkspace = {
          ...defaultWorkspace,
          settings: {
            ...defaultWorkspace.settings,
            userName: name,
          },
        };
        localStorage.setItem(`dashboard-workspace-${newUser.id}`, JSON.stringify(userWorkspace));

        // Auto-login
        set({
          workspace: userWorkspace,
          currentTabId: userWorkspace.tabs[0]?.id || null,
          authState: {
            isAuthenticated: true,
            currentUser: newUser,
          },
        });

        return true;
      },

      login: (email, password) => {
        const users = JSON.parse(localStorage.getItem('dashboard-users') || '[]');
        const hashedPassword = btoa(password);
        const user = users.find((u: any) => u.email === email && u.password === hashedPassword);

        if (!user) {
          return false;
        }

        // Load user's workspace
        const userWorkspaceData = localStorage.getItem(`dashboard-workspace-${user.id}`);
        const userWorkspace = userWorkspaceData ? JSON.parse(userWorkspaceData) : {
          ...defaultWorkspace,
          settings: {
            ...defaultWorkspace.settings,
            userName: user.name,
          },
        };

        set({
          workspace: userWorkspace,
          currentTabId: userWorkspace.tabs[0]?.id || null,
          authState: {
            isAuthenticated: true,
            currentUser: {
              id: user.id,
              email: user.email,
              name: user.name,
              createdAt: user.createdAt,
            },
          },
        });

        return true;
      },

      logout: async () => {
        // Save current workspace before logout
        const state = get();
        if (state.authState.currentUser) {
          localStorage.setItem(
            `dashboard-workspace-${state.authState.currentUser.id}`,
            JSON.stringify(state.workspace)
          );
        }

        // Sign out from Firebase
        try {
          const { signOut } = await import('firebase/auth');
          const { auth } = await import('../config/firebase');
          await signOut(auth);
          // Reset auth state
          set((state) => ({
            authState: {
              ...state.authState,
              user: null,
              isAuthenticated: false
            }
          }));
        } catch (error) {
          console.error('Sign out error:', error);
        }

        set({
          workspace: defaultWorkspace,
          currentTabId: null,
          authState: {
            isAuthenticated: false,
            currentUser: null,
          },
        });
      },
    }),
    {
      name: 'myspacehub-storage',
      version: 2,
    }
  )
);
