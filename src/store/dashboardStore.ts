import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import type { Unsubscribe } from "firebase/firestore";

import { auth } from "../config/firebase";
import {
  createDefaultSnapshot,
  cloneSnapshot,
  DEFAULT_PREFERENCES,
  generateId,
} from "./dashboardDefaults";
import type {
  AiConfig,
  DashboardSnapshot,
  DashboardUser,
  FavoriteListing,
  NotificationItem,
  Preferences,
  SavedSearch,
  Task,
  TaskColumn,
  TaskPriority,
} from "./dashboardTypes";
import { DASHBOARD_SNAPSHOT_VERSION } from "./dashboardTypes";
import {
  fetchDashboardSnapshot,
  saveDashboardSnapshot,
  subscribeDashboardSnapshot,
} from "../lib/firebase-dashboard";

const SAVE_DEBOUNCE_MS = 1500;

interface DashboardState extends DashboardSnapshot {
  currentUser: DashboardUser | null;
  syncStatus: "idle" | "connecting" | "ready" | "error";
  syncError: string | null;
  initialized: boolean;
  lastSyncedAt: string | null;
  pendingWrites: number;
  isOffline: boolean;

  registerUser: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  loginUser: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (user: DashboardUser) => Promise<void>;
  logout: () => Promise<void>;

  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => string;
  updateTask: (id: string, updates: Partial<Omit<Task, "id">>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, column: TaskColumn) => void;

  addNotification: (
    notification: Omit<NotificationItem, "id" | "time" | "read"> & {
      time?: string;
      read?: boolean;
    },
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  addSavedSearch: (query: string) => void;
  removeSavedSearch: (id: string) => void;

  toggleFavoriteListing: (listing: Omit<FavoriteListing, "createdAt">) => void;
  setListingFeedback: (listingId: string, feedback: "like" | "dislike") => void;

  updatePreferences: (updates: Partial<Preferences>) => void;
  updateNotificationChannels: (
    updates: Partial<Preferences["notificationChannels"]>,
  ) => void;
  setTheme: (theme: Preferences["theme"]) => void;
  setLanguage: (language: Preferences["language"]) => void;
  setAccentColor: (accent: Preferences["accentColor"]) => void;
  setFont: (font: Preferences["font"]) => void;
  setHighContrast: (enabled: boolean) => void;

  setAiProvider: (provider: AiConfig["provider"]) => void;
  setSelectedModel: (model: string) => void;
  addCustomModel: (model: string) => void;
  removeCustomModel: (model: string) => void;
  setAllowAttachments: (allowed: boolean) => void;

  handleAuthChange: (user: FirebaseUser | null) => Promise<void>;
  startCloudSync: (userId: string) => Promise<void>;
  stopCloudSync: () => void;
}

let currentSyncUserId: string | null = null;
let snapshotUnsubscribe: Unsubscribe | null = null;
let saveTimer: number | null = null;
let lastSavedSnapshotJSON: string | null = null;
let applyingRemoteSnapshot = false;
let authListenerAttached = false;

const errorFromFirebase = (error: unknown): string => {
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code?: string }).code ?? "");
    if (code.includes("auth/email-already-in-use")) {
      return "Аккаунт с таким email уже существует";
    }
    if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
      return "Неверный email или пароль";
    }
    if (code.includes("auth/user-not-found")) {
      return "Пользователь не найден";
    }
    if (code.includes("auth/network-request-failed")) {
      return "Проблема с сетью. Проверьте подключение к интернету";
    }
    if (code.includes("auth/too-many-requests")) {
      return "Слишком много попыток. Попробуйте позже";
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Произошла ошибка. Попробуйте снова";
};

const captureSnapshotFromState = (state: DashboardState): DashboardSnapshot =>
  cloneSnapshot({
    version: DASHBOARD_SNAPSHOT_VERSION,
    updatedAt: state.updatedAt ?? new Date().toISOString(),
    preferences: state.preferences,
    ai: state.ai,
    tasks: state.tasks,
    notifications: state.notifications,
    savedSearches: state.savedSearches,
    favoriteListings: state.favoriteListings,
    listingFeedback: state.listingFeedback,
    gallery: state.gallery,
  });

const applyRemoteSnapshotToState = (set: (fn: (state: DashboardState) => DashboardState) => void) =>
  (snapshot: DashboardSnapshot) => {
    applyingRemoteSnapshot = true;
    const clone = cloneSnapshot(snapshot);
    lastSavedSnapshotJSON = JSON.stringify(clone);
    set((state) => ({
      ...state,
      ...clone,
      syncStatus: "ready",
      syncError: null,
      initialized: true,
      lastSyncedAt: clone.updatedAt,
    }));
    applyingRemoteSnapshot = false;
  };

const createDashboardStore = () =>
  persist<DashboardState, [], [], Partial<DashboardState>>(
    (set, get) => {
      const defaultSnapshot = createDefaultSnapshot();
      const applyRemoteSnapshot = applyRemoteSnapshotToState((updater) => set(updater));

      const scheduleSave = () => {
        if (typeof window === "undefined") {
          return;
        }
        if (!currentSyncUserId || applyingRemoteSnapshot) {
          return;
        }
        if (saveTimer) {
          window.clearTimeout(saveTimer);
        }
        saveTimer = window.setTimeout(async () => {
          saveTimer = null;
          const state = get();
          const snapshot = captureSnapshotFromState(state);
          const serialized = JSON.stringify(snapshot);
          if (serialized === lastSavedSnapshotJSON) {
            return;
          }

          set((current) => ({
            ...current,
            pendingWrites: current.pendingWrites + 1,
            syncStatus: current.syncStatus === "error" ? "ready" : current.syncStatus,
          }));

          try {
            await saveDashboardSnapshot(currentSyncUserId!, snapshot);
            lastSavedSnapshotJSON = serialized;
            set((current) => ({
              ...current,
              pendingWrites: Math.max(0, current.pendingWrites - 1),
              lastSyncedAt: snapshot.updatedAt,
              syncStatus: "ready",
              syncError: null,
            }));
          } catch (error) {
            set((current) => ({
              ...current,
              pendingWrites: Math.max(0, current.pendingWrites - 1),
              syncStatus: "error",
              syncError: errorFromFirebase(error),
            }));
          }
        }, SAVE_DEBOUNCE_MS);
      };

      const stopCloudSync = () => {
        if (snapshotUnsubscribe) {
          snapshotUnsubscribe();
          snapshotUnsubscribe = null;
        }
        if (typeof window !== "undefined" && saveTimer) {
          window.clearTimeout(saveTimer);
          saveTimer = null;
        }
        currentSyncUserId = null;
        lastSavedSnapshotJSON = null;
      };

      const startCloudSync = async (userId: string) => {
        if (typeof window === "undefined") {
          return;
        }
        if (currentSyncUserId === userId) {
          return;
        }

        stopCloudSync();
        currentSyncUserId = userId;
        set((state) => ({ ...state, syncStatus: "connecting", syncError: null }));

        try {
          const remote = await fetchDashboardSnapshot(userId);
          const localSnapshot = captureSnapshotFromState(get());
          const localUpdated = Date.parse(localSnapshot.updatedAt ?? "0");
          const remoteUpdated = Date.parse(remote.updatedAt ?? "0");

          const initial = localUpdated > remoteUpdated ? localSnapshot : remote;
          if (localUpdated > remoteUpdated) {
            await saveDashboardSnapshot(userId, initial);
          }
          applyRemoteSnapshot(initial);

          snapshotUnsubscribe = subscribeDashboardSnapshot(
            userId,
            (snapshot) => {
              if (applyingRemoteSnapshot) {
                return;
              }
              applyRemoteSnapshot(snapshot);
            },
            (error) => {
              set((state) => ({
                ...state,
                syncStatus: "error",
                syncError: errorFromFirebase(error),
              }));
            },
          );

          set((state) => ({
            ...state,
            syncStatus: "ready",
            syncError: null,
            lastSyncedAt: initial.updatedAt,
          }));
        } catch (error) {
          set((state) => ({
            ...state,
            syncStatus: "error",
            syncError: errorFromFirebase(error),
          }));
        }
      };

      const handleAuthChange = async (firebaseUser: FirebaseUser | null) => {
        if (!firebaseUser) {
          stopCloudSync();
          const snapshot = createDefaultSnapshot();
          set((state) => ({
            ...state,
            ...snapshot,
            currentUser: null,
            syncStatus: "idle",
            syncError: null,
            pendingWrites: 0,
            lastSyncedAt: null,
            initialized: true,
          }));
          return;
        }

        const dashboardUser: DashboardUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName ?? firebaseUser.email ?? "Пользователь",
          email: firebaseUser.email ?? "",
          avatar: firebaseUser.photoURL ?? null,
        };

        set((state) => ({ ...state, currentUser: dashboardUser }));
        await startCloudSync(dashboardUser.id);
      };

      const state: DashboardState = {
        ...defaultSnapshot,
        currentUser: null,
        syncStatus: "idle",
        syncError: null,
        initialized: false,
        lastSyncedAt: null,
        pendingWrites: 0,
        isOffline: false,

        registerUser: async (name, email, password) => {
          try {
            const credential = await createUserWithEmailAndPassword(
              auth,
              email.trim().toLowerCase(),
              password,
            );
            if (credential.user) {
              await updateProfile(credential.user, { displayName: name.trim() });
              const snapshot = createDefaultSnapshot();
              snapshot.preferences = {
                ...snapshot.preferences,
                language: DEFAULT_PREFERENCES.language,
              };
              await saveDashboardSnapshot(credential.user.uid, snapshot);
            }
            return { success: true };
          } catch (error) {
            return { success: false, message: errorFromFirebase(error) };
          }
        },

        loginUser: async (email, password) => {
          try {
            await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            return { success: true };
          } catch (error) {
            return { success: false, message: errorFromFirebase(error) };
          }
        },

        loginWithGoogle: async (user) => {
          set((state) => ({ ...state, currentUser: user }));
          await startCloudSync(user.id);
        },

        logout: async () => {
          try {
            await signOut(auth);
          } finally {
            stopCloudSync();
            const snapshot = createDefaultSnapshot();
            set((state) => ({
              ...state,
              ...snapshot,
              currentUser: null,
              syncStatus: "idle",
              syncError: null,
              pendingWrites: 0,
              lastSyncedAt: null,
              initialized: true,
            }));
          }
        },

        addTask: (taskInput) => {
          const id = generateId();
          const now = new Date().toISOString();
          const newTask: Task = {
            id,
            title: taskInput.title,
            description: taskInput.description,
            tags: [...taskInput.tags],
            priority: taskInput.priority,
            progress: taskInput.progress,
            date: taskInput.date,
            attachments: taskInput.attachments ?? 0,
            column: taskInput.column,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            ...state,
            tasks: [...state.tasks, newTask],
            updatedAt: now,
          }));
          scheduleSave();
          return id;
        },

        updateTask: (id, updates) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            tasks: state.tasks.map((task) =>
              task.id === id
                ? {
                    ...task,
                    ...updates,
                    tags: updates.tags ? [...updates.tags] : task.tags,
                    updatedAt: now,
                  }
                : task,
            ),
            updatedAt: now,
          }));
          scheduleSave();
        },

        deleteTask: (id) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            tasks: state.tasks.filter((task) => task.id !== id),
            updatedAt: now,
          }));
          scheduleSave();
        },

        moveTask: (id, column) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            tasks: state.tasks.map((task) =>
              task.id === id
                ? {
                    ...task,
                    column,
                    updatedAt: now,
                  }
                : task,
            ),
            updatedAt: now,
          }));
          scheduleSave();
        },

        addNotification: (notification) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            notifications: [
              {
                id: generateId(),
                title: notification.title,
                time: notification.time ?? new Date().toLocaleString(),
                read: notification.read ?? false,
              },
              ...state.notifications,
            ],
            updatedAt: now,
          }));
          scheduleSave();
        },

        markNotificationRead: (id) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            notifications: state.notifications.map((notification) =>
              notification.id === id ? { ...notification, read: true } : notification,
            ),
            updatedAt: now,
          }));
          scheduleSave();
        },

        markAllNotificationsRead: () => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            notifications: state.notifications.map((notification) => ({
              ...notification,
              read: true,
            })),
            updatedAt: now,
          }));
          scheduleSave();
        },

        clearNotifications: () => {
          const now = new Date().toISOString();
          set((state) => ({ ...state, notifications: [], updatedAt: now }));
          scheduleSave();
        },

        addSavedSearch: (query) => {
          if (!query.trim()) {
            return;
          }
          const now = new Date().toISOString();
          set((state) => {
            const exists = state.savedSearches.find(
              (search) => search.query.toLowerCase() === query.toLowerCase(),
            );
            if (exists) {
              return state;
            }
            const saved: SavedSearch = {
              id: generateId(),
              query,
              createdAt: now,
            };
            return {
              ...state,
              savedSearches: [...state.savedSearches, saved],
              updatedAt: now,
            };
          });
          scheduleSave();
        },

        removeSavedSearch: (id) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            savedSearches: state.savedSearches.filter((search) => search.id !== id),
            updatedAt: now,
          }));
          scheduleSave();
        },

        toggleFavoriteListing: (listing) => {
          const now = new Date().toISOString();
          set((state) => {
            const exists = state.favoriteListings.find((item) => item.id === listing.id);
            if (exists) {
              return {
                ...state,
                favoriteListings: state.favoriteListings.filter((item) => item.id !== listing.id),
                updatedAt: now,
              };
            }
            const entry: FavoriteListing = {
              ...listing,
              createdAt: now,
            };
            return {
              ...state,
              favoriteListings: [...state.favoriteListings, entry],
              updatedAt: now,
            };
          });
          scheduleSave();
        },

        setListingFeedback: (listingId, feedback) => {
          const now = new Date().toISOString();
          set((state) => {
            const next = { ...state.listingFeedback };
            if (next[listingId] === feedback) {
              delete next[listingId];
            } else {
              next[listingId] = feedback;
            }
            return {
              ...state,
              listingFeedback: next,
              updatedAt: now,
            };
          });
          scheduleSave();
        },

        updatePreferences: (updates) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            preferences: {
              ...state.preferences,
              ...updates,
              notificationChannels: {
                ...state.preferences.notificationChannels,
                ...(updates.notificationChannels ?? {}),
              },
            },
            updatedAt: now,
          }));
          scheduleSave();
        },

        updateNotificationChannels: (updates) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            preferences: {
              ...state.preferences,
              notificationChannels: {
                ...state.preferences.notificationChannels,
                ...updates,
              },
            },
            updatedAt: now,
          }));
          scheduleSave();
        },

        setTheme: (theme) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            preferences: { ...state.preferences, theme },
            updatedAt: now,
          }));
          scheduleSave();
        },

        setLanguage: (language) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            preferences: { ...state.preferences, language },
            updatedAt: now,
          }));
          scheduleSave();
        },

        setAccentColor: (accent) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            preferences: { ...state.preferences, accentColor: accent },
            updatedAt: now,
          }));
          scheduleSave();
        },

        setFont: (font) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            preferences: { ...state.preferences, font },
            updatedAt: now,
          }));
          scheduleSave();
        },

        setHighContrast: (enabled) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            preferences: { ...state.preferences, highContrast: enabled },
            updatedAt: now,
          }));
          scheduleSave();
        },

        setAiProvider: (provider) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            ai: { ...state.ai, provider },
            updatedAt: now,
          }));
          scheduleSave();
        },

        setSelectedModel: (model) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            ai: { ...state.ai, selectedModel: model },
            updatedAt: now,
          }));
          scheduleSave();
        },

        addCustomModel: (model) => {
          const trimmed = model.trim();
          if (!trimmed) {
            return;
          }
          const now = new Date().toISOString();
          set((state) => {
            if (state.ai.customModels.includes(trimmed)) {
              return state;
            }
            return {
              ...state,
              ai: {
                ...state.ai,
                customModels: [...state.ai.customModels, trimmed],
              },
              updatedAt: now,
            };
          });
          scheduleSave();
        },

        removeCustomModel: (model) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            ai: {
              ...state.ai,
              customModels: state.ai.customModels.filter((item) => item !== model),
            },
            updatedAt: now,
          }));
          scheduleSave();
        },

        setAllowAttachments: (allowed) => {
          const now = new Date().toISOString();
          set((state) => ({
            ...state,
            ai: { ...state.ai, allowAttachments: allowed },
            updatedAt: now,
          }));
          scheduleSave();
        },

        handleAuthChange,
        startCloudSync,
        stopCloudSync,
      };

      return state;
    },
    {
      name: "dashboard-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        ai: state.ai,
        tasks: state.tasks,
        notifications: state.notifications,
        savedSearches: state.savedSearches,
        favoriteListings: state.favoriteListings,
        listingFeedback: state.listingFeedback,
        gallery: state.gallery,
        updatedAt: state.updatedAt,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate dashboard state", error);
        } else {
          useDashboardStore.setState((current) => ({
            ...current,
            initialized: true,
          }));
        }
      },
    },
  );

export const useDashboardStore = create<DashboardState>()(createDashboardStore());

if (typeof window !== "undefined" && !authListenerAttached) {
  authListenerAttached = true;
  onAuthStateChanged(auth, (firebaseUser) => {
    useDashboardStore.getState().handleAuthChange(firebaseUser).catch((error) => {
      console.error("Failed to handle auth change", error);
    });
  });
}

export type {
  Task,
  TaskPriority,
  TaskColumn,
  NotificationItem,
  SavedSearch,
  FavoriteListing,
  DashboardUser,
  Preferences,
  AiConfig,
  DashboardSnapshot,
} from "./dashboardTypes";

