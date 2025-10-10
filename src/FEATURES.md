# ✨ MySpaceHub Features Overview

Полный список возможностей MySpaceHub 2.0

## 🎯 Core Features

### 📋 Kanban Boards
- [x] Multi-tab workspace organization
- [x] Drag & drop cards between columns
- [x] Custom column management (add, edit, delete, reorder)
- [x] Search across all cards
- [x] Filter by tags and priority
- [x] Real-time card counting
- [x] Empty states with helpful prompts

### 🎴 Smart Cards (5 Types)

#### 1. 📝 Task Cards
- Title, description (Markdown support)
- Priority levels (low, medium, high)
- Tags for organization
- Due dates with reminders
- Checklist with auto-generation from text
- Comments system
- File attachments
- Pomodoro timer integration
- Time tracking

#### 2. 🎓 Flashcard Cards
- Question/Answer format
- Spaced repetition ready
- Study mode
- Progress tracking
- Auto-generation from text content

#### 3. 🍳 Recipe Cards
- Ingredients extraction (AI-powered)
- Cooking time
- Shopping list generation
- Step-by-step instructions
- Photo gallery for results

#### 4. 📓 Note Cards
- Full Markdown editor
- Code blocks support
- Lists and formatting
- Quick capture
- Link attachments

#### 5. 💻 PC Component Cards (NEW!)
- Component type (GPU, CPU, RAM, etc.)
- Condition tracking (new, like-new, good, fair, for-parts)
- Price comparison (my price vs market price)
- OLX/Allegro links
- Serial number tracking
- Specifications storage
- Photo gallery for tests/components
- Purchase checklist

## 🤖 AI Assistant

### Quick Actions
- 📝 **Summarize Text** — Create concise summaries
- ✏️ **Simplify** — Rewrite text in simpler language
- 🎴 **Generate Flashcards** — Auto-create Q&A pairs
- 📋 **Study Plan** — Create learning schedules
- 🧮 **Solve Problems** — Math/homework help
- 🛒 **Shopping List** — Extract from recipes
- 🏪 **Analyze OLX** — Review marketplace listings
- 💰 **Price Assessment** — Evaluate fair prices

### Features
- [x] Chat history with persistence
- [x] Multiple conversations
- [x] Context-aware responses
- [x] Provider selection (Ollama/OpenRouter/Mock)
- [x] API key management
- [x] Enable/disable toggle

### Supported Providers
- **Ollama** — Free, runs locally (requires installation)
- **OpenRouter** — Cloud-based, API key required
- **Local Mock** — Testing without real AI

## 📸 Photo Gallery

### Upload Methods
- [x] Drag & drop files
- [x] Paste from clipboard (Ctrl+V)
- [x] Click to browse files
- [x] Multiple files at once

### Organization
- [x] Tags for quick search
- [x] Captions for context
- [x] Date tracking
- [x] Size optimization (base64)

### Viewing
- [x] Grid view with thumbnails
- [x] Full-screen viewer
- [x] Zoom in/out
- [x] Download images
- [x] Delete images

### Use Cases
- Serial numbers for PC components
- Test results screenshots
- Component photos before/after repair
- Recipe results
- Study diagrams and notes
- Progress photos

## 🛒 OLX/Allegro Search (NEW!)

### Component Types
1. 🎮 GPU / Видеокарта
2. ⚡ CPU / Процессор
3. 💾 RAM / Оперативная память
4. 🔌 Материнская плата
5. 💿 SSD / Накопитель
6. 💽 HDD
7. 🔋 PSU / Блок питания
8. 📦 Корпус
9. ❄️ Кулер / Охлаждение

### Features
- [x] Smart search by component type
- [x] Price filtering (max price)
- [x] Model/keyword search
- [x] Results with details (price, condition, location)
- [x] One-click add to board
- [x] Auto-checklist generation for purchases
- [x] Direct links to listings

### Integration Ready
- Mock data for development
- Easy to connect real OLX API
- See `/OLX_INTEGRATION.md` for guide

## 🎨 Themes & Appearance

### 4 Themes
1. ☀️ **Light** — Classic bright theme
2. 🌙 **Dark** — Night-friendly dark theme
3. ⚡ **Neon** — Gaming-style with cyan/magenta
4. ✨ **Minimal** — Clean monochrome design

### Customization
- [x] Accent color picker
- [x] Font family selection
- [x] High contrast mode
- [x] Glassmorphism effects
- [x] Gradient backgrounds
- [x] Custom CSS variables

## 📊 Analytics

### Metrics
- Total cards count
- Completed vs active tasks
- Time spent per tab
- Completion rate percentage
- Cards by priority distribution
- Cards by type distribution
- Pomodoro sessions count

### Visualizations
- Bar charts (Recharts)
- Progress indicators
- Tag cloud
- Time spent breakdown

## 💾 Import/Export

### Export Formats
- **JSON** — Full workspace backup
  - All cards with data
  - Settings preserved
  - Tab structure
  - Images included (base64)
- **CSV** — Cards table
  - Spreadsheet-friendly
  - Filter/sort in Excel
  - Basic card info

### Import
- [x] JSON full restore
- [x] Validation and error handling
- [x] Preview before import
- [x] Merge or replace options

## 🌍 Internationalization

### Supported Languages
- 🇷🇺 **Русский** (Russian) — Full support
- 🇵🇱 **Polski** (Polish) — Full support
- 🇬🇧 **English** — Full support

### Features
- [x] UI text translation
- [x] Date/time formatting
- [x] Number formatting
- [x] Currency support (zł)
- [x] Dynamic switching

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | Create new card |
| `Escape` | Close all panels |
| `Ctrl+V` | Paste image (in gallery) |
| `Enter` | Send message (AI chat) |
| `Shift+Enter` | New line (AI chat) |

## ♿ Accessibility

### Features
- [x] Full keyboard navigation
- [x] ARIA labels and roles
- [x] Focus indicators
- [x] High contrast mode
- [x] Screen reader friendly
- [x] Semantic HTML
- [x] Alt text for images

## 📱 Responsive Design

### Breakpoints
- [x] Mobile (< 640px)
- [x] Tablet (640px - 1024px)
- [x] Desktop (> 1024px)

### Adaptations
- Collapsible sidebar on mobile
- Touch-friendly targets
- Responsive grids
- Adaptive typography
- Mobile-optimized modals

## 🔧 Developer Features

### Tech Stack
- React 18.3 + TypeScript 5.6
- Vite (fast builds)
- Tailwind CSS 4.0
- Zustand (state management)
- @dnd-kit (drag & drop)
- Shadcn/ui (components)
- Lucide React (icons)

### Architecture
- Component-based structure
- Type-safe throughout
- Persistent state (localStorage)
- Modular design
- Easy to extend

### Storage
- localStorage for data
- base64 for images
- JSON serialization
- Version migration support

## 🚀 Performance

### Optimizations
- [x] Lazy loading components
- [x] Debounced search
- [x] Memoized calculations
- [x] Efficient re-renders
- [x] Optimized images
- [x] Code splitting

### Limits
- ~5-10MB localStorage (browser dependent)
- ~1000-5000 cards recommended
- Image size < 2MB per image
- Total images < 50 per card

## 🔐 Privacy & Security

### Data Handling
- [x] 100% local storage
- [x] No server required
- [x] No analytics/tracking
- [x] No cookies
- [x] Export your data anytime

### AI Privacy
- Ollama: 100% local, private
- OpenRouter: Data sent to API
- User controls all data

## 🎓 Smart Features

### Auto-Generation
- [x] Checklist from description text
- [x] Ingredients from recipe text
- [x] Flashcards from study material
- [x] Shopping lists from recipes
- [x] Study plans from topics

### Time Management
- [x] Pomodoro timer (25/5 min)
- [x] Time tracking per card
- [x] Session counting
- [x] Break reminders
- [x] Analytics per tab

### Organization
- [x] Tag-based filtering
- [x] Priority color coding
- [x] Search across all content
- [x] Column customization
- [x] Card templates

## 🎯 Use Cases

### 📚 Students
- Organize study materials
- Create flashcards
- Track assignments
- Pomodoro study sessions
- Exam preparation

### 💻 PC Enthusiasts
- Track components inventory
- Compare prices
- Document repairs
- Serial number database
- Market research

### 🍳 Home Cooks
- Recipe collection
- Shopping list management
- Cooking notes
- Photo gallery of dishes
- Meal planning

### 📝 Personal Organization
- Task management
- Note-taking
- Project tracking
- Idea collection
- Goal setting

## 🔮 Planned Features (Roadmap)

### Version 2.1
- [ ] Real OLX API integration
- [ ] Export with photos (ZIP)
- [ ] Video support in gallery
- [ ] Enhanced PC component analytics
- [ ] Batch operations on cards

### Version 2.5
- [ ] Supabase sync (optional)
- [ ] Shared workspaces
- [ ] Mobile app (React Native)
- [ ] Calendar integration
- [ ] Notifications system

### Version 3.0
- [ ] Real-time collaboration
- [ ] Team workspaces
- [ ] Advanced permissions
- [ ] API for integrations
- [ ] Plugin system

---

**MySpaceHub 2.0** — All features in one place! 🚀
