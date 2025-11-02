import type {
  AiConfig,
  DashboardSnapshot,
  NotificationItem,
  Preferences,
  SavedSearch,
  Task,
  FavoriteListing,
} from "./dashboardTypes";
import { DASHBOARD_SNAPSHOT_VERSION } from "./dashboardTypes";

export const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createDefaultTasks = (): Task[] => {
  const now = new Date().toISOString();
  return [
    {
      id: generateId(),
      title: "Изучить React Hooks",
      description: "Пройти документацию и примеры",
      tags: ["React", "JavaScript"],
      priority: "high",
      progress: 30,
      date: new Date().toISOString().slice(0, 10),
      attachments: 2,
      column: "todo",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: "Настроить Tailwind CSS",
      description: "Конфигурация и кастомизация",
      tags: ["CSS", "Design"],
      priority: "medium",
      progress: 60,
      date: new Date().toISOString().slice(0, 10),
      attachments: 1,
      column: "progress",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: "Создать API для проекта",
      description: "REST API с аутентификацией",
      tags: ["Backend", "API"],
      priority: "high",
      progress: 85,
      date: new Date().toISOString().slice(0, 10),
      attachments: 3,
      column: "progress",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: "Написать тесты",
      description: "Unit и интеграционные тесты",
      tags: ["Testing", "Quality"],
      priority: "low",
      progress: 100,
      date: new Date().toISOString().slice(0, 10),
      attachments: 0,
      column: "done",
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export const createDefaultNotifications = (): NotificationItem[] => [
  { id: generateId(), title: "Новый проект создан", time: "2 минуты назад", read: false },
  { id: generateId(), title: "Задача завершена", time: "1 час назад", read: false },
  { id: generateId(), title: "Новый результат поиска", time: "3 часа назад", read: true },
];

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "light",
  accentColor: "indigo",
  font: "inter",
  highContrast: false,
  language: "ru",
  timezone: "europe-moscow",
  notificationsEnabled: true,
  notificationChannels: {
    tasks: true,
    search: true,
    analytics: false,
    sounds: true,
  },
};

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "openrouter",
  selectedModel: "",
  customModels: [],
  allowAttachments: true,
};

export const createDefaultSnapshot = (): DashboardSnapshot => {
  const now = new Date().toISOString();
  return {
    version: DASHBOARD_SNAPSHOT_VERSION,
    updatedAt: now,
    preferences: { ...DEFAULT_PREFERENCES },
    ai: { ...DEFAULT_AI_CONFIG },
    tasks: createDefaultTasks(),
    notifications: createDefaultNotifications(),
    savedSearches: [],
    favoriteListings: [],
    listingFeedback: {},
    gallery: [],
  };
};

export const cloneSnapshot = (snapshot: DashboardSnapshot): DashboardSnapshot => ({
  version: snapshot.version,
  updatedAt: snapshot.updatedAt,
  preferences: { ...snapshot.preferences },
  ai: { ...snapshot.ai, customModels: [...snapshot.ai.customModels] },
  tasks: snapshot.tasks.map((task) => ({ ...task, tags: [...task.tags] })),
  notifications: snapshot.notifications.map((notification) => ({ ...notification })),
  savedSearches: snapshot.savedSearches.map((search) => ({ ...search })),
  favoriteListings: snapshot.favoriteListings.map((listing) => ({ ...listing })),
  listingFeedback: { ...snapshot.listingFeedback },
  gallery: snapshot.gallery.map((item) => ({ ...item, tags: [...item.tags] })),
});

export const normalizeSnapshot = (input: Partial<DashboardSnapshot> | undefined): DashboardSnapshot => {
  const defaults = createDefaultSnapshot();
  if (!input) {
    return defaults;
  }

  return {
    version: typeof input.version === "number" ? input.version : DASHBOARD_SNAPSHOT_VERSION,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : new Date().toISOString(),
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(input.preferences ?? {}),
      notificationChannels: {
        ...DEFAULT_PREFERENCES.notificationChannels,
        ...(input.preferences?.notificationChannels ?? {}),
      },
    },
    ai: {
      ...DEFAULT_AI_CONFIG,
      ...(input.ai ?? {}),
      customModels: Array.isArray(input.ai?.customModels)
        ? [...new Set(input.ai!.customModels.filter((item): item is string => typeof item === "string"))]
        : [],
    },
    tasks: Array.isArray(input.tasks)
      ? input.tasks.map((task) => ({
          ...task,
          tags: Array.isArray(task.tags) ? task.tags : [],
        }))
      : createDefaultTasks(),
    notifications: Array.isArray(input.notifications)
      ? input.notifications.map((item) => ({ ...item }))
      : createDefaultNotifications(),
    savedSearches: Array.isArray(input.savedSearches)
      ? input.savedSearches.map((item) => ({ ...item }))
      : [],
    favoriteListings: Array.isArray(input.favoriteListings)
      ? input.favoriteListings.map((item) => ({ ...item }))
      : [],
    listingFeedback:
      input && typeof input.listingFeedback === "object" && input.listingFeedback
        ? { ...(input.listingFeedback as Record<string, "like" | "dislike">) }
        : {},
    gallery: Array.isArray(input.gallery)
      ? input.gallery.map((item) => ({
          ...item,
          tags: Array.isArray(item.tags) ? item.tags : [],
        }))
      : [],
  };
};

export const mergeSnapshotWithLocal = (
  local: DashboardSnapshot,
  remote: DashboardSnapshot,
): DashboardSnapshot => {
  const localUpdated = Date.parse(local.updatedAt ?? "0");
  const remoteUpdated = Date.parse(remote.updatedAt ?? "0");
  return localUpdated > remoteUpdated ? cloneSnapshot(local) : cloneSnapshot(remote);
};

export type DashboardCollections = {
  tasks: Task[];
  notifications: NotificationItem[];
  savedSearches: SavedSearch[];
  favoriteListings: FavoriteListing[];
};