export type TaskPriority = "high" | "medium" | "low";
export type TaskColumn = "todo" | "progress" | "done";

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

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface Preferences {
  theme: "light" | "dark";
  accentColor: "indigo" | "blue" | "purple" | "green" | "orange";
  font: "inter" | "roboto" | "system";
  highContrast: boolean;
  language: "ru" | "en" | "pl";
  timezone: string;
  notificationsEnabled: boolean;
  notificationChannels: {
    tasks: boolean;
    search: boolean;
    analytics: boolean;
    sounds: boolean;
  };
}

export interface AiConfig {
  provider: "openrouter" | "custom";
  selectedModel: string;
  customModels: string[];
  allowAttachments: boolean;
}

export interface GalleryItem {
  id: string;
  url: string;
  title?: string;
  description?: string;
  tags: string[];
  createdAt: string;
  storagePath?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export interface DashboardSnapshot {
  version: number;
  updatedAt: string;
  preferences: Preferences;
  ai: AiConfig;
  tasks: Task[];
  notifications: NotificationItem[];
  savedSearches: SavedSearch[];
  favoriteListings: FavoriteListing[];
  listingFeedback: Record<string, "like" | "dislike">;
  gallery: GalleryItem[];
}

export const DASHBOARD_SNAPSHOT_VERSION = 1;