# ✨ Karo Dashboard

Современная персональная панель управления в стиле Apple с поддержкой Kanban-досок, AI-ассистента и полной кросс-платформенностью.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.3.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

## 🎨 Новый дизайн в стиле Apple

- 🍎 **Apple-inspired UI** - минималистичный и элегантный дизайн
- 💫 **Плавные анимации** - использование Framer Motion для естественных переходов
- 🌈 **Glassmorphism** - эффект матового стекла с размытием фона
- 🎯 **Адаптивность** - идеальный вид на всех устройствах (iPhone, iPad, Desktop)
- ⚡ **60 FPS анимации** - оптимизированная производительность
- 🔄 **Динамические градиенты** - живой и современный фон

## ✨ Основные возможности

- 🎯 **Kanban-доски** с drag-and-drop в стиле iOS
- 📝 **Карточки задач** с красивым оформлением
- 🎨 **Множество тем** (Apple Light, Apple Dark, Neon, Minimal)
- 🌐 **Многоязычность** (русский, английский, украинский)
- 📊 **Аналитика** задач и продуктивности
- 🤖 **AI-ассистент** с markdown форматированием
- 🔍 **Интеграция с OLX** для поиска объявлений
- 💾 **Import/Export** данных
- ⚡ **Горячие клавиши** для быстрого доступа
- 🔐 **Firebase Authentication** для безопасного входа
- ☁️ **Облачная синхронизация** через Firebase Realtime Database

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение откроется по адресу [http://localhost:5173](http://localhost:5173)

### Сборка для production

```bash
npm run build
```

## 📱 Кросс-платформенность

### 📱 Mobile (iOS/Android)
- Адаптивная верстка для экранов от 320px
- Оптимизация для touch-устройств
- Поддержка safe areas (iPhone notch)
- Свайп-жесты для навигации
- PWA support для установки на главный экран

### 💻 Tablet (iPad)
- Оптимизированное использование пространства
- Split-view поддержка
- Apple Pencil friendly интерфейс

### 🖥️ Desktop
- Полнофункциональный интерфейс
- Горячие клавиши
- Hover эффекты
- Контекстные меню

## 📁 Структура проекта

```
karo-dashboard/
├── src/
│   ├── components/      # React компоненты
│   │   ├── ui/         # UI библиотека (shadcn/ui)
│   │   ├── AppHeader.tsx   # Шапка с анимациями
│   │   ├── AppSidebar.tsx  # Боковая панель
│   │   └── ...
│   ├── store/          # Zustand store
│   ├── data/           # Данные по умолчанию
│   ├── types/          # TypeScript типы
│   ├── styles/         # Глобальные стили
│   │   └── globals.css # Apple theme
│   └── App.tsx         # Главный компонент
├── backend/            # Express API для OLX
└── README.md
```

## 🛠️ Технологии

### Frontend
- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик и dev-сервер
- **Zustand** - управление состоянием
- **Tailwind CSS** - стилизация
- **shadcn/ui** - UI компоненты
- **Framer Motion** - анимации
- **dnd-kit** - drag and drop
- **Recharts** - графики
- **Firebase** - Auth + Realtime Database

### Backend
- **Node.js + Express** - REST API
- **Puppeteer** - web scraping
- **Cheerio** - HTML parsing

## ⌨️ Клавиатурные сокращения

- `N` - Создать новую карточку
- `Ctrl+K` / `Cmd+K` - OLX поиск
- `Ctrl+/` / `Cmd+/` - AI ассистент
- `Esc` - Закрыть открытые панели
- `Enter` - Отправить AI сообщение

## 📝 Основной функционал

### Kanban-доски
- Создание нескольких вкладок (досок)
- Настраиваемые колонки в стиле Trello
- Плавное перетаскивание карточек
- Автосохранение в облаке

### Карточки
- Заголовок и описание с Markdown
- Типы: задача, заметка, рецепт, флешкарта
- Приоритеты с цветовыми индикаторами
- Теги для категоризации
- Чеклисты для подзадач
- Прикрепление изображений
- Напоминания
- Комментарии

### Темы

- **Apple Light** - светлая тема в стиле macOS/iOS
- **Apple Dark** - темная тема с OLED-friendly цветами
- **Neon** - яркая neon-тема для геймеров
- **Minimal** - минималистичная монохромная тема

## 🌐 Языки

- 🇷🇺 Русский (по умолчанию)
- 🇬🇧 English
- 🇺🇦 Українська
- 🇵🇱 Polski

## 📊 Аналитика

- Статистика по задачам
- Распределение по приоритетам
- Анализ продуктивности
- Графики и диаграммы
- Pomodoro таймер

## 🤖 AI-ассистент

Поддержка нескольких провайдеров:
- OpenRouter
- OpenAI
- Ollama (локальный)
- Perplexity AI

Функции:
- Помощь в создании задач
- Генерация чеклистов
- Советы по продуктивности
- Markdown рендеринг ответов

## 🔍 OLX интеграция

- Поиск объявлений
- Создание карточек из объявлений
- Отслеживание интересных предложений
- Сравнение цен

## 🔐 Безопасность

- Firebase Authentication
- Google Sign-In
- Защищенное хранение данных
- CORS настройки
- Rate limiting для API

## 📦 Развертывание

### GitHub Pages
Подробная инструкция в файле [GITHUB_SETUP.md](./GITHUB_SETUP.md)

### Vercel / Netlify
```bash
npm run build
# deploy dist/
```

### Docker
```bash
docker build -t karo-dashboard .
docker run -p 3000:3000 karo-dashboard
```

## 📄 Лицензия

MIT License

## 🔗 Ссылки

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [shadcn/ui](https://ui.shadcn.com/)

## 👨‍💻 Разработка

### Запуск тестов
```bash
npm test
```

### Проверка типов
```bash
npx tsc --noEmit
```

### Форматирование кода
```bash
npm run format
```

## 🚧 Roadmap

- [x] Apple-стиль дизайна
- [x] Кросс-платформенность
- [x] Плавные анимации
- [x] Firebase интеграция
- [ ] Оффлайн режим (PWA)
- [ ] Мобильное приложение (React Native)
- [ ] Больше интеграций (Telegram, Calendar)
- [ ] Совместная работа над досками
- [ ] Расширенная аналитика

## 🎉 Благодарности

- Apple за вдохновение в дизайне
- shadcn за отличную UI библиотеку
- Framer за Motion библиотеку
- Сообщество React за поддержку

---

Сделано с ❤️ и кофе ☕ | Karo Dashboard © 2025
