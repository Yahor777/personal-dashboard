import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type TaskPriority = "high" | "medium" | "low";
type TaskColumn = "todo" | "progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  tags: string[];
  priority: TaskPriority;
  progress: number;
  date: string;
  attachments: number;
  column: TaskColumn;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  read: boolean;
}

export interface SavedSearch {
  id: string;
  query: string;
  createdAt: string;
}

export interface FavoriteListing {
  id: string;
  title: string;
  price: string;
  url: string;
  location?: string;
  createdAt: string;
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface DashboardState {
  tasks: Task[];
  notifications: NotificationItem[];
  savedSearches: SavedSearch[];
  favoriteListings: FavoriteListing[];
  users: StoredUser[];
  currentUser: DashboardUser | null;
  listingFeedback: Record<string, "like" | "dislike">;

  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => string;
  updateTask: (id: string, updates: Partial<Omit<Task, "id">>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, column: TaskColumn) => void;

  addNotification: (notification: Omit<NotificationItem, "id" | "time" | "read"> & { time?: string; read?: boolean }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  addSavedSearch: (query: string) => void;
  removeSavedSearch: (id: string) => void;

  toggleFavoriteListing: (listing: Omit<FavoriteListing, "createdAt">) => void;
  setListingFeedback: (listingId: string, feedback: "like" | "dislike") => void;

  registerUser: (name: string, email: string, password: string) => { success: boolean; message?: string };
  loginUser: (email: string, password: string) => { success: boolean; message?: string };
  loginWithGoogle: (user: { id: string; name: string; email: string; avatar?: string | null }) => void;
  logout: () => void;
}

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultTasks: Task[] = [
  {
    id: "task-1",
    title: "Изучить React Hooks",
    description: "Пройти документацию и примеры",
    tags: ["React", "JavaScript"],
    priority: "high",
    progress: 30,
    date: "2025-11-05",
    attachments: 2,
    column: "todo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    title: "Настроить Tailwind CSS",
    description: "Конфигурация и кастомизация",
    tags: ["CSS", "Design"],
    priority: "medium",
    progress: 60,
    date: "2025-11-03",
    attachments: 1,
    column: "progress",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-3",
    title: "Создать API для проекта",
    description: "REST API с аутентификацией",
    tags: ["Backend", "API"],
    priority: "high",
    progress: 85,
    date: "2025-11-01",
    attachments: 3,
    column: "progress",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-4",
    title: "Написать тесты",
    description: "Unit и интеграционные тесты",
    tags: ["Testing", "Quality"],
    priority: "low",
    progress: 100,
    date: "2025-10-28",
    attachments: 0,
    column: "done",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultNotifications: NotificationItem[] = [
  { id: "notif-1", title: "Новый проект создан", time: "2 минуты назад", read: false },
  { id: "notif-2", title: "Задача завершена", time: "1 час назад", read: false },
  { id: "notif-3", title: "Новый результат поиска", time: "3 часа назад", read: true },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      tasks: defaultTasks,
      notifications: defaultNotifications,
      savedSearches: [],
      favoriteListings: [],
      users: [],
      currentUser: null,
  listingFeedback: {},

      addTask: (taskInput) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newTask: Task = {
          id,
          title: taskInput.title,
          description: taskInput.description,
          tags: taskInput.tags,
          priority: taskInput.priority,
          progress: taskInput.progress,
          date: taskInput.date,
          attachments: taskInput.attachments ?? 0,
          column: taskInput.column,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        return id;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
      },

      moveTask: (id, column) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, column, updatedAt: new Date().toISOString() }
              : task
          ),
        }));
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [
            {
              id: generateId(),
              title: notification.title,
              time: notification.time ?? new Date().toLocaleString(),
              read: notification.read ?? false,
            },
            ...state.notifications,
          ],
        }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          ),
        }));
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      addSavedSearch: (query) => {
        if (!query.trim()) {
          return;
        }
        const exists = get().savedSearches.find(
          (search) => search.query.toLowerCase() === query.toLowerCase()
        );
        if (exists) {
          return;
        }
        set((state) => ({
          savedSearches: [
            ...state.savedSearches,
            { id: generateId(), query, createdAt: new Date().toISOString() },
          ],
        }));
      },

      removeSavedSearch: (id) => {
        set((state) => ({
          savedSearches: state.savedSearches.filter((search) => search.id !== id),
        }));
      },

      toggleFavoriteListing: (listing) => {
        set((state) => {
          const exists = state.favoriteListings.find((item) => item.id === listing.id);
          if (exists) {
            return {
              favoriteListings: state.favoriteListings.filter((item) => item.id !== listing.id),
            };
          }
          return {
            favoriteListings: [
              ...state.favoriteListings,
              {
                ...listing,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
      },

      setListingFeedback: (listingId, feedback) => {
        set((state) => {
          const next = { ...state.listingFeedback };
          if (next[listingId] === feedback) {
            delete next[listingId];
          } else {
            next[listingId] = feedback;
          }
          return { listingFeedback: next };
        });
      },

      registerUser: (name, email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const exists = get().users.find((user) => user.email === normalizedEmail);
        if (exists) {
          return { success: false, message: "Пользователь с таким email уже существует" };
        }
        const id = generateId();
        const passwordHash = btoa(password);
        const newStoredUser: StoredUser = {
          id,
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
        };
        set((state) => ({
          users: [...state.users, newStoredUser],
          currentUser: { id, name: name.trim(), email: normalizedEmail },
        }));
        return { success: true };
      },

      loginUser: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const passwordHash = btoa(password);
        const user = get().users.find(
          (stored) => stored.email === normalizedEmail && stored.passwordHash === passwordHash
        );
        if (!user) {
          return { success: false, message: "Неверный email или пароль" };
        }
        set({
          currentUser: { id: user.id, name: user.name, email: user.email },
        });
        return { success: true };
      },

      loginWithGoogle: (user) => {
        set({
          currentUser: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar ?? null,
          },
        });
      },

      logout: () => {
        set({ currentUser: null });
      },
    }),
    {
      name: "dashboard-state",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

export type { TaskPriority, TaskColumn };