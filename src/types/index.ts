// Core Types for MySpaceHub

export type CardType = 'task' | 'flashcard' | 'recipe' | 'note' | 'pc-component';
export type Priority = 'low' | 'medium' | 'high';
export type Language = 'ru' | 'pl' | 'en';
export type Theme = 'light' | 'dark' | 'neon' | 'minimal';
export type ComponentCondition = 'new' | 'like-new' | 'good' | 'fair' | 'for-parts';
export type AIProvider = 'none' | 'openrouter' | 'openai' | 'ollama';

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
  type: 'file' | 'photo' | 'link';
  size?: number;
  uploadedAt?: string;
}

export interface CardImage {
  id: string;
  url: string;
  dataUrl?: string; // base64 for local storage
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
  description: string; // Markdown
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
  // Flashcard specific
  question?: string;
  answer?: string;
  // Recipe specific
  ingredients?: string[];
  cookingTime?: number;
  // PC Component specific
  componentType?: string; // 'gpu' | 'cpu' | 'ram' | 'motherboard' | etc
  condition?: ComponentCondition;
  myPrice?: number;
  marketPrice?: number;
  olxLink?: string;
  serialNumber?: string;
  specifications?: Record<string, string>;
  // Timer
  pomodoroCount?: number;
  timeSpent?: number; // in minutes
}

export interface Column {
  id: string;
  title: string;
  order: number;
  cardIds: string[];
}

export type TabTemplate = 'school' | 'cooking' | 'personal' | 'blank' | 'pc-repair' | 'marketplace';

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
  ollamaUrl?: string;
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
  role: 'user' | 'assistant' | 'system';
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

export interface AppState {
  workspace: Workspace;
  currentTabId: string | null;
  searchQuery: string;
  filterTags: string[];
  filterPriority: Priority[];
  onboardingCompleted: boolean;
  aiConversations: AIConversation[];
  currentConversationId: string | null;
}
