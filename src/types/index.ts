// Core domain types shared across the dashboard
export type CardType =
  | "task"
  | "flashcard"
  | "recipe"
  | "note"
  | "pc-component"
  | "pc-build";

export type Priority = "low" | "medium" | "high";
export type Language = "ru" | "pl" | "en";
export type Theme = "light" | "dark" | "neon" | "minimal";
export type ComponentCondition = "new" | "like-new" | "good" | "fair" | "for-parts";
export type AIProvider = "none" | "openrouter" | "openai" | "ollama" | "perplexity";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: "file" | "photo" | "link";
  size?: number;
  uploadedAt?: string;
}

export interface CardImage {
  id: string;
  url: string;
  dataUrl?: string;
  caption?: string;
  tags: string[];
  uploadedAt: string;
}

export interface Reminder {
  id: string;
  date: string;
  notified: boolean;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  type: CardType;
  priority: Priority;
  tags: string[];
  dueDate?: string;
  reminders: Reminder[];
  attachments: Attachment[];
  images: CardImage[];
  checklist: ChecklistItem[];
  comments: Comment[];
  columnId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  question?: string;
  answer?: string;
  ingredients?: string[];
  cookingTime?: number;
  componentType?: string;
  condition?: ComponentCondition;
  myPrice?: number;
  marketPrice?: number;
  olxLink?: string;
  serialNumber?: string;
  specifications?: Record<string, string>;
  pomodoroCount?: number;
  timeSpent?: number;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  cardIds: string[];
}

export type TabTemplate =
  | "school"
  | "cooking"
  | "personal"
  | "blank"
  | "pc-repair"
  | "marketplace";

export interface Tab {
  id: string;
  title: string;
  template: TabTemplate;
  columns: Column[];
  createdAt: string;
  order: number;
}

export interface AppSettings {
  theme: Theme;
  language: Language;
  accentColor: string;
  fontFamily: string;
  highContrast: boolean;
  notifications: boolean;
  userName?: string;
  aiEnabled?: boolean;
  aiProvider?: AIProvider;
  aiApiKey?: string;
  aiModel?: string;
  aiCustomModel?: string;
  ollamaUrl?: string;
  onboardingCompleted?: boolean;
  enableScrollButtons?: boolean;
}

export interface Analytics {
  completedCards: number;
  totalCards: number;
  timeByTab: Record<string, number>;
  completedByDate: Record<string, number>;
}

export interface Workspace {
  id: string;
  name: string;
  tabs: Tab[];
  cards: Card[];
  settings: AppSettings;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
}

export interface AppState {
  workspace: Workspace;
  currentTabId: string | null;
  searchQuery: string;
  filterTags: string[];
  filterPriority: Priority[];
  aiConversations: AIConversation[];
  currentConversationId: string | null;
  authState: AuthState;
}
