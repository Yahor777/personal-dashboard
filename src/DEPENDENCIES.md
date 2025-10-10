# Зависимости проекта

Полный список зависимостей для проекта "Моя Панель".

## Основные зависимости (dependencies)

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  
  "zustand": "^4.5.0",
  
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  
  "recharts": "^2.10.0",
  
  "lucide-react": "^0.300.0",
  
  "motion": "latest",
  
  "sonner": "^2.0.3",
  
  "@radix-ui/react-accordion": "^1.1.2",
  "@radix-ui/react-alert-dialog": "^1.0.5",
  "@radix-ui/react-aspect-ratio": "^1.0.3",
  "@radix-ui/react-avatar": "^1.0.4",
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-collapsible": "^1.0.3",
  "@radix-ui/react-context-menu": "^2.1.5",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-hover-card": "^1.0.7",
  "@radix-ui/react-label": "^2.0.2",
  "@radix-ui/react-menubar": "^1.0.4",
  "@radix-ui/react-navigation-menu": "^1.1.4",
  "@radix-ui/react-popover": "^1.0.7",
  "@radix-ui/react-progress": "^1.0.3",
  "@radix-ui/react-radio-group": "^1.1.3",
  "@radix-ui/react-scroll-area": "^1.0.5",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-separator": "^1.0.3",
  "@radix-ui/react-slider": "^1.1.2",
  "@radix-ui/react-slot": "^1.0.2",
  "@radix-ui/react-switch": "^1.0.3",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-toast": "^1.1.5",
  "@radix-ui/react-toggle": "^1.0.3",
  "@radix-ui/react-toggle-group": "^1.0.4",
  "@radix-ui/react-tooltip": "^1.0.7",
  
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.2.0",
  
  "date-fns": "^3.0.0"
}
```

## Dev зависимости (devDependencies)

```json
{
  "@types/react": "^18.3.0",
  "@types/react-dom": "^18.3.0",
  "@vitejs/plugin-react": "^4.2.1",
  "vite": "^5.1.0",
  "typescript": "^5.3.0",
  "tailwindcss": "^4.0.0",
  "autoprefixer": "^10.4.0",
  "postcss": "^8.4.0",
  "eslint": "^8.56.0"
}
```

## Описание зависимостей

### Основной стек

**React 18** - Основной UI фреймворк
- `react` - Библиотека для создания UI
- `react-dom` - Рендеринг React в DOM

**Zustand** - State management
- `zustand` - Легковесный state manager с middleware для persistence

### Drag & Drop

**@dnd-kit** - Современная библиотека drag and drop
- `@dnd-kit/core` - Ядро библиотеки
- `@dnd-kit/sortable` - Сортируемые списки
- `@dnd-kit/utilities` - Утилиты (CSS transform и т.д.)

### Визуализация данных

**Recharts** - Библиотека для графиков и charts
- `recharts` - Bar charts, Pie charts для аналитики

### Иконки и анимации

**Lucide React** - Набор иконок
- `lucide-react` - 1000+ иконок в React компонентах

**Motion** - Анимации
- `motion` - Современная анимационная библиотека (Framer Motion)

### UI Components

**Radix UI** - Unstyled accessible компоненты
- Все `@radix-ui/react-*` пакеты - Примитивы для shadcn/ui

**Sonner** - Toast notifications
- `sonner` - Красивые уведомления

**Утилиты для стилей**
- `class-variance-authority` - CVA для вариантов компонентов
- `clsx` - Условные классы
- `tailwind-merge` - Merge Tailwind классов без конфликтов

**Работа с датами**
- `date-fns` - Утилиты для дат (форматирование, парсинг)

### Build Tools

**Vite** - Быстрый сборщик
- `vite` - Dev server и production build
- `@vitejs/plugin-react` - React plugin для Vite

**TypeScript**
- `typescript` - Типизация
- `@types/react`, `@types/react-dom` - Типы для React

**Tailwind CSS v4**
- `tailwindcss` - CSS framework
- `autoprefixer` - PostCSS plugin
- `postcss` - CSS processor

## Установка

```bash
# NPM
npm install

# Yarn
yarn install

# PNPM
pnpm install
```

## Размер bundle (примерная оценка)

```
React + React DOM:          ~140 KB
Zustand:                    ~3 KB
@dnd-kit (все пакеты):      ~50 KB
Recharts:                   ~100 KB
Radix UI (все компоненты):  ~150 KB
Lucide React (tree-shaken): ~20 KB
Motion:                     ~40 KB
Утилиты:                    ~10 KB
────────────────────────────────────
ИТОГО (gzipped):            ~250-300 KB
```

## Оптимизация

### Code Splitting
```typescript
// Lazy load аналитики
const AnalyticsPanel = lazy(() => import('./components/AnalyticsPanel'));

// Lazy load импорт/экспорт
const ImportExportPanel = lazy(() => import('./components/ImportExportPanel'));
```

### Tree Shaking
- Lucide icons импортируются по отдельности
- Radix UI компоненты используются только нужные
- Recharts charts импортируются индивидуально

### Dynamic Import
```typescript
// Загрузка библиотек по требованию
const loadChartLibrary = () => import('recharts');
```

## Альтернативы (если нужно уменьшить bundle)

### Вместо Recharts
- `chart.js` + `react-chartjs-2` (~80 KB вместо 100 KB)
- Нативный Canvas API (0 KB, но больше кода)

### Вместо @dnd-kit
- `react-beautiful-dnd` (старая, но меньше размером)
- Нативный HTML5 Drag and Drop API (0 KB, но сложнее)

### Вместо Motion
- `react-spring` (меньше размером)
- CSS animations (0 KB)

### Вместо всех Radix UI
- Headless UI (меньше компонентов)
- Собственные unstyled компоненты

## Browser Support

```
Chrome:  последние 2 версии
Firefox: последние 2 версии
Safari:  последние 2 версии
Edge:    последние 2 версии
```

### Polyfills
Не требуются для современных браузеров (ES2020+)

## Лицензии

Все зависимости имеют MIT или аналогичные permissive лицензии:
- React: MIT
- Zustand: MIT
- @dnd-kit: MIT
- Recharts: MIT
- Radix UI: MIT
- Lucide: ISC (similar to MIT)
- Motion: MIT

## Обновление зависимостей

```bash
# Проверить устаревшие пакеты
npm outdated

# Обновить все до latest (осторожно!)
npm update

# Обновить конкретный пакет
npm install react@latest

# Проверить уязвимости
npm audit
npm audit fix
```

## Troubleshooting

### Peer Dependencies
Если возникают warnings о peer dependencies:
```bash
npm install --legacy-peer-deps
```

### Version Conflicts
Используйте `package-lock.json` или `yarn.lock` для фиксации версий

### Build Errors
1. Очистите кэш: `rm -rf node_modules package-lock.json`
2. Переустановите: `npm install`
3. Обновите Node.js до v18+

---

Все зависимости тщательно подобраны для баланса между функциональностью, размером и производительностью.
