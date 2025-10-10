# Моя Панель - Техническая Спецификация

## 1. Обзор проекта

### 1.1 Цель
Создать полнофункциональное SPA-приложение для организации учёбы, рецептов и личных заметок с использованием канбан-методологии.

### 1.2 Целевая аудитория
- Студенты и школьники
- Люди, организующие рецепты и готовку
- Пользователи, нуждающиеся в личном менеджере задач

### 1.3 Ключевые принципы
- **Простота** - интуитивный интерфейс
- **Гибкость** - настраиваемые вкладки и колонки
- **Производительность** - быстрая работа с большим объёмом данных
- **Accessibility** - доступность для всех пользователей

## 2. Функциональные требования

### 2.1 Вкладки (Tabs)

#### CRUD операции
- ✅ Создание новой вкладки с выбором шаблона
- ✅ Переименование вкладки
- ✅ Удаление вкладки (с подтверждением)
- ✅ Сортировка вкладок (drag & drop)

#### Шаблоны вкладок
1. **School (Учёба)**
   - Колонки: К изучению | В процессе | Выполнено
   - Оптимизировано для учебных задач

2. **Cooking (Готовка)**
   - Колонки: Попробовать | Список покупок | Приготовлено
   - Поддержка рецептов и ингредиентов

3. **Personal (Личное)**
   - Колонки: Идеи | В процессе | Готово
   - Для личных проектов и заметок

4. **Blank (Пустой)**
   - Колонки: To Do | In Progress | Done
   - Универсальный шаблон

### 2.2 Колонки (Columns)

#### CRUD операции
- ✅ Добавление новой колонки
- ✅ Переименование колонки
- ✅ Удаление колонки (с предупреждением об удалении карточек)
- ✅ Изменение порядка колонок

#### Поведение
- Минимум 1 колонка на вкладке
- Максимум рекомендуется 6 колонок для удобства
- Автоматическая ширина (320px)

### 2.3 Карточки (Cards)

#### Типы карточек
1. **Task (Задача)**
   - Стандартная задача с чек-листом
   - Поддержка сроков и приоритетов

2. **Flashcard (Карточка для запоминания)**
   - Вопрос/ответ формат
   - Для изучения языков, формул и т.д.

3. **Recipe (Рецепт)**
   - Список ингредиентов
   - Время приготовления
   - Пошаговая инструкция

4. **Note (Заметка)**
   - Свободная форма
   - Markdown поддержка

#### Поля карточки
```typescript
interface Card {
  // Основные
  id: string;
  title: string;              // Обязательное
  description: string;        // Markdown
  type: CardType;
  priority: Priority;
  
  // Организация
  tags: string[];
  columnId: string;
  order: number;
  
  // Сроки
  dueDate?: string;
  reminders: Reminder[];
  
  // Содержимое
  attachments: Attachment[];
  checklist: ChecklistItem[];
  comments: Comment[];
  
  // Метаданные
  createdAt: string;
  updatedAt: string;
  
  // Специфичные поля
  question?: string;          // для flashcard
  answer?: string;            // для flashcard
  ingredients?: string[];     // для recipe
  cookingTime?: number;       // для recipe
  
  // Трекинг времени
  pomodoroCount?: number;
  timeSpent?: number;         // в минутах
}
```

#### CRUD операции
- ✅ Создание карточки (быстрое создание + детальное редактирование)
- ✅ Редактирование карточки (в drawer)
- ✅ Удаление карточки
- ✅ Дублирование карточки
- ✅ Перемещение карточки (drag & drop)
- ✅ Быстрое завершение (переместить в "Done")

### 2.4 Drag & Drop

#### Возможности
- ✅ Перетаскивание карточек внутри колонки
- ✅ Перетаскивание карточек между колонками
- ✅ Визуальная обратная связь (overlay)
- ✅ Сохранение порядка после перезагрузки

#### Технология
- Библиотека: @dnd-kit
- Стратегия: PointerSensor с activationConstraint
- Collision: closestCorners

### 2.5 Поиск и фильтрация

#### Поиск
- По заголовку карточки
- По содержимому (description)
- По тегам
- Режим real-time (без кнопки поиска)

#### Фильтры
- По тегам (множественный выбор)
- По приоритету (low/medium/high)
- По дате создания
- По типу карточки

### 2.6 Умные функции

#### 1. Генерация чек-листов
```typescript
// Алгоритм
function generateChecklist(description: string): ChecklistItem[] {
  const lines = description.split('\n');
  const listItems = lines.filter(line => 
    line.trim().match(/^[-*]\s/) || 
    line.trim().match(/^\d+\./)
  );
  return listItems.map(item => ({
    id: generateId(),
    text: cleanListItem(item),
    completed: false
  }));
}
```

#### 2. Извлечение ингредиентов (для рецептов)
```typescript
// Паттерны для поиска
const patterns = [
  /(\d+)\s*(г|гр|грамм)/,
  /(\d+)\s*(шт|штук)/,
  /(\d+)\s*(ст\.л|столов)/,
  /(\d+)\s*(ч\.л|чайн)/
];

function extractIngredients(description: string): string[] {
  // Поиск строк с единицами измерения
}
```

#### 3. Flashcards генерация
- Автоматическое создание пар вопрос-ответ
- Из списков определений
- Из формул и уравнений

#### 4. Pomodoro таймер
- Привязан к конкретной карточке
- Стандартные интервалы: 25/15/5 минут
- Трекинг количества сессий
- Подсчёт общего времени

### 2.7 Импорт/Экспорт

#### JSON Export (Full Backup)
```json
{
  "id": "workspace-id",
  "name": "Workspace Name",
  "tabs": [...],
  "cards": [...],
  "settings": {...},
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

#### CSV Export (Cards Table)
```csv
ID,Title,Type,Priority,Tags,Created,Column
card-1,"Math Exam",task,high,"math,exam",2025-10-10,In Progress
```

#### Import
- JSON валидация перед импортом
- Предупреждение о перезаписи данных
- Опция merge vs replace

### 2.8 Настройки

#### Внешний вид
```typescript
interface AppSettings {
  theme: 'light' | 'dark';
  accentColor: string;        // HEX
  fontFamily: string;
  highContrast: boolean;
}
```

#### Локализация
- Русский (RU) 🇷🇺
- Польский (PL) 🇵🇱
- Английский (EN) 🇬🇧

#### Уведомления
- Включение/выключение
- Напоминания о задачах
- Desktop notifications (через Notification API)

### 2.9 Аналитика

#### Метрики
1. **Общая статистика**
   - Всего карточек
   - Выполнено карточек
   - Процент завершения

2. **Время по вкладкам**
   - Bar chart: вкладка → время
   - Общее время фокусировки

3. **Распределение по приоритетам**
   - Pie chart: high/medium/low
   - Количество карточек каждого приоритета

4. **Типы карточек**
   - Bar chart: task/flashcard/recipe/note
   - Соотношение типов

5. **Облако тегов**
   - Визуализация популярных тегов
   - Размер пропорционален использованию

6. **Pomodoro статистика**
   - Всего сессий
   - Общее время работы
   - Средняя продолжительность

## 3. Нефункциональные требования

### 3.1 Производительность
- Первая отрисовка: < 1s
- Время отклика drag & drop: < 16ms (60 FPS)
- Поддержка до 5000 карточек без деградации
- Debounce для поиска: 300ms

### 3.2 Доступность (A11y)

#### ARIA атрибуты
```html
<div role="button" aria-label="Add card" tabindex="0">
<input aria-describedby="error-message">
<nav aria-label="Sidebar navigation">
```

#### Keyboard Support
- Tab navigation
- Enter/Space для активации
- Arrow keys для навигации
- Esc для закрытия модалов

#### Visual
- Контрастность: минимум 4.5:1
- High contrast mode
- Focus indicators
- Без использования только цвета для информации

### 3.3 Responsive Design

#### Breakpoints
```css
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
```

#### Mobile адаптация
- Стек колонок вместо горизонтального scroll
- Drawer вместо sidebar
- Увеличенные touch targets (минимум 44x44px)
- Swipe gestures

### 3.4 Безопасность

#### LocalStorage
- XSS защита (sanitize HTML)
- Валидация JSON при импорте
- Ограничение размера данных

#### Будущий backend
- HTTPS only
- JWT tokens с expiration
- CSRF protection
- Rate limiting

### 3.5 SEO & Meta

```html
<meta name="description" content="Персональная панель для организации учёбы и жизни">
<meta name="keywords" content="канбан, задачи, рецепты, организация">
<meta property="og:title" content="Моя Панель">
<meta name="viewport" content="width=device-width, initial-scale=1">
```

## 4. Архитектура

### 4.1 Frontend Architecture

```
┌─────────────────────────────────────┐
│         React Application           │
├─────────────────────────────────────┤
│  Components (UI)                    │
│  ├─ AppSidebar                      │
│  ├─ KanbanBoard                     │
│  ├─ CardDrawer                      │
│  └─ Settings/Analytics              │
├─────────────────────────────────────┤
│  State Management (Zustand)         │
│  ├─ Workspace State                 │
│  ├─ UI State                        │
│  └─ Persistence Middleware          │
├─────────────────────────────────────┤
│  Data Layer                         │
│  ├─ LocalStorage Adapter            │
│  └─ (Future: REST API Adapter)      │
└─────────────────────────────────────┘
```

### 4.2 Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Zustand Action
    ↓
State Update
    ↓
LocalStorage Persist
    ↓
React Re-render
```

### 4.3 State Management

#### Zustand Store Structure
```typescript
interface Store {
  // State
  workspace: Workspace;
  currentTabId: string | null;
  searchQuery: string;
  filterTags: string[];
  filterPriority: Priority[];
  onboardingCompleted: boolean;
  
  // Actions
  addTab: (title, template) => void;
  updateTab: (id, updates) => void;
  deleteTab: (id) => void;
  addCard: (card) => void;
  updateCard: (id, updates) => void;
  deleteCard: (id) => void;
  moveCard: (id, columnId, order) => void;
  // ... и т.д.
}
```

#### Persist Configuration
```typescript
persist(storeConfig, {
  name: 'my-panel-storage',
  version: 1,
  migrate: (persistedState, version) => {
    // Миграция при изменении schema
  }
})
```

## 5. UI/UX Спецификация

### 5.1 Color System

```css
/* Semantic Colors */
--background: oklch(...)  /* Основной фон */
--foreground: oklch(...)  /* Основной текст */
--primary: oklch(...)     /* Акцентный цвет */
--secondary: oklch(...)   /* Вторичный цвет */
--muted: oklch(...)       /* Приглушённый */
--accent: oklch(...)      /* Акцент для hover */
--destructive: oklch(...) /* Опасные действия */
--border: oklch(...)      /* Границы */

/* Status Colors */
--success: green
--warning: yellow
--error: red
--info: blue
```

### 5.2 Typography Scale

```css
/* Headings */
h1: 2xl (32px)
h2: xl (24px)
h3: lg (20px)
h4: base (16px)

/* Body */
p, input: base (16px)

/* Small */
caption, label: sm (14px)
```

### 5.3 Spacing Scale

```css
/* Tailwind default */
0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64
/* В px: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, ... */
```

### 5.4 Component Specs

#### Card Component
```
┌─────────────────────────┐
│ 🎴 Type    [Priority]   │ ← 8px padding
│                         │
│ Card Title              │ ← h4, truncate at 2 lines
│                         │
│ [tag1] [tag2] [+2]      │ ← badges, max 3 visible
│                         │
│ 📅 Oct 10  ✓ 2/5  📎 3  │ ← metadata icons
└─────────────────────────┘
Width: 320px
Min-height: 120px
Border-radius: var(--radius)
Shadow: sm on hover → md
```

#### Kanban Column
```
┌───────────────────────┐
│ Column Title (3)  ⋮   │ ← h3 + count + menu
├───────────────────────┤
│                       │
│  [Card 1]             │ ← 8px gap
│                       │
│  [Card 2]             │
│                       │
│  [Card 3]             │
│                       │
│  ...                  │
│                       │
├───────────────────────┤
│ + Add Card            │ ← bottom action
└───────────────────────┘
Width: 320px
Padding: 12px
Background: muted/30
```

### 5.5 Onboarding Flow

```
Step 1: Welcome
├─ Приветствие
├─ Краткое описание
└─ [Skip] [Next]

Step 2: Create Tab
├─ Объяснение вкладок
├─ Выбор шаблона
└─ [Skip] [Next]

Step 3: Add Card
├─ Объяснение карточек
├─ Демо drag & drop
└─ [Skip] [Next]

Step 4: Complete
├─ Поздравление
├─ Дополнительные фичи
└─ [Start]
```

### 5.6 Empty States

#### Нет вкладок
```
🗂️
"Нет вкладок"
"Создайте первую вкладку, чтобы начать"
[+ Создать вкладку]
```

#### Пустая колонка
```
📭
"Нет карточек"
"Добавьте новую карточку или перетащите существующую"
[+ Новая карточка]
```

#### Нет результатов поиска
```
🔍
"Ничего не найдено"
"Попробуйте другой запрос или очистите фильтры"
[Очистить фильтры]
```

## 6. Тестирование

### 6.1 Unit Tests
- Zustand actions
- Utility functions
- Validation logic

### 6.2 Integration Tests
- Card CRUD flow
- Drag & drop
- Import/Export
- Filters & Search

### 6.3 E2E Tests (Playwright/Cypress)
```typescript
test('Complete task flow', async ({ page }) => {
  // 1. Create tab
  // 2. Add card
  // 3. Edit card
  // 4. Move to done
  // 5. Verify persistence
});
```

### 6.4 Accessibility Tests
- axe-core integration
- Keyboard navigation
- Screen reader compatibility

### 6.5 Performance Tests
- Lighthouse CI
- Bundle size < 500KB
- Time to Interactive < 3s

## 7. Deployment

### 7.1 Build
```bash
npm run build
# Output: dist/
```

### 7.2 Hosting Options
- Vercel (recommended)
- Netlify
- GitHub Pages
- Self-hosted (nginx)

### 7.3 Environment Variables
```env
VITE_API_URL=https://api.example.com  # for future backend
VITE_VERSION=1.0.0
```

## 8. Future Enhancements

### Phase 2 (Backend Integration)
- User authentication
- Cloud sync
- Collaboration features
- Real-time updates (WebSocket)

### Phase 3 (Advanced Features)
- Mobile app (React Native)
- Desktop app (Electron)
- Browser extension
- Calendar integration
- AI-powered suggestions

### Phase 4 (Enterprise)
- Team workspaces
- Permissions & roles
- Audit logs
- Advanced analytics
- White-label solution

## 9. Ссылки и ресурсы

### Библиотеки
- React: https://react.dev
- Zustand: https://zustand-demo.pmnd.rs
- dnd-kit: https://dndkit.com
- Shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com

### Design Inspiration
- Trello: https://trello.com
- Notion: https://notion.so
- Todoist: https://todoist.com

### Standards
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/
- ARIA: https://www.w3.org/WAI/ARIA/

---

**Версия спецификации:** 1.0  
**Дата:** 10 октября 2025  
**Статус:** Реализовано
