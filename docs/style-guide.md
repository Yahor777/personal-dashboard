# Стилевое руководство (Nova/Aurora Design System)

Цель: обеспечить единый, современный, доступный дизайн приложения на базе токенов и утилити-классов.

## Принципы дизайна
- Единая палитра и типографика на всех экранах.
- 8px-решётка (Tailwind spacing — кратно 4px, совмещаем в шагах 8/16/24).
- Чёткие состояния (hover, focus, active) через `--ring` и `--primary`.
- Минимум произвольных цветов — используем переменные темы.
- Высокая контрастность и доступность (WCAG AA/AAA где возможно).

## Дизайн-токены (ключевые)
- Цвета: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`.
- Палитра бренда: `--primary: oklch(0.62 0.22 265)`, `--accent: oklch(0.74 0.14 230)`.
- Радиусы: `--radius` (база), производные `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`.
- Тени: `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`.
- Градиент бренда: `--brand-gradient` (от `--primary` к `--accent`).

Темы:
- По умолчанию (`:root`) — светлая Aurora.
- `.dark` — ночная версия (усиленные тени, корректные контрасты).
- Дополнительно: `.neon`, `.minimal` для альтернативных стилей.

## Утилити-классы (globals.css)
- `panel` — универсальная панель/карточка: фон, бордер, радиус, тень.
- `panel-lg` — усиленная тень.
- `toolbar` — верхняя панель/хедер: фон, blur, бордер.
- `brand-gradient` — фон-градиент бренда (комбинируется с `bg-clip-text text-transparent`).
- `soft-card` — облегчённая карточка для второстепенных блоков.
- `glass` — стеклянный фон с blur и бордером.
- `chip` — чип/тэг для метаданных.
- `elevate-{xs|sm|md|lg}` — уровни тени.

## Типографика
- База: системный sans (`--font-sans`), моно — для кода (`--font-mono`).
- Масштаб: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`.
- Заголовки по умолчанию заданы в `@layer base` (globals.css). При необходимости уточняйте классами Tailwind.

## Отступы и сетка
- База: кратно 8px (используем `gap-2`/`gap-4`/`gap-6` и т. п.).
- Внутренние отступы карточек: `p-3`, `p-4`.
- Контентная ширина: контейнеры `max-w-7xl` для основных скрин-лейаутов.

## Состояния взаимодействия
- Hover: `hover:text-primary`, для навигации — подчёркивание через псевдо-элементы.
- Focus: видимый `outline` с `--ring` (`outline-ring/50` применяется глобально).
- Active/Pressed: `data-state` у компонентов из UI-библиотеки или утилиты тени/перехода.

## Комбинаторика с Tailwind
- Цветовые классы без хардкода — используем `text-primary`, `bg-background`, `border-border`.
- Избегаем прямых значений (`text-green-600` и т. п.) — применяем токены.
- Переходы: `transition-colors` + `ease-in-out`.

## Пример применения
```tsx
// Хедер/toolbar
<div className="toolbar elevate-sm sticky top-0 z-30 w-full">
  <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 md:px-6">
    <div className="flex items-center gap-2">
      <span className="brand-gradient bg-clip-text text-transparent font-semibold">MySpaceHub</span>
    </div>
  </div>
</div>

// Панель/карточка
<section className="panel p-4">
  <h3 className="text-lg font-medium">Заголовок</h3>
  <p className="text-sm text-muted-foreground">Описание блока...</p>
</section>
```

## Адаптивность и платформы
- Мобильные навигационные элементы учитывают безопасные зоны (`pb-safe`, `pt-safe`).
- Горизонтальные контейнеры используют `data-scroll-x` для плавной прокрутки.
- Работоспособность тем: класс `dark` на `html` переключает тёмную тему.

## Доступность
- Контраст: минимум AA для текста и ключевых UI-элементов.
- Фокус: всегда видимый, не скрывать outline.
- Размеры кликабельных элементов не менее `44x44px`.

## Что дальше
- Применять `panel`/`toolbar` к основным экранам.
- Удалять произвольные цветовые классы, переходить на токены.
- Расширить паттерны (таблицы, формы, модальные окна) на базе этих утилит.