# 📝 Changelog v0.5.0 - AI & OLX Search Features

> **Release Date:** 2024-12-XX  
> **Build:** 1,404.46 kB (gzip: 420.97 kB)  
> **Status:** ✅ Production Ready

---

## 🎯 Overview

Major feature release focused on AI experience improvements and complete OLX search functionality. This release adds model switching directly in chat, advanced search filters, PC build mode, and enhanced AI analysis for marketplace listings.

---

## ✨ New Features

### 🤖 AI Model Selector in Chat
- **Quick Model Switching:** Select from 4 free models directly in AI chat header
- **No Settings Navigation:** Change models without leaving chat interface
- **Visual Feedback:** Dropdown shows model name + speed rating
- **Auto-Save:** Selection persists to workspace settings automatically
- **Toast Notifications:** Confirmation when model is changed

**Models Available:**
1. Meta Llama 3.1 8B Instruct (128K context) - ⚡⚡⚡⚡⚡ Default
2. Google Gemma 2 9B IT (8K context) - ⚡⚡⚡⚡
3. Mistral 7B Instruct (8K context) - ⚡⚡⚡⚡⚡
4. Microsoft Phi-3 Medium 128K (128K context) - ⚡⚡⚡

**Location:** AI Chat Header → Model dropdown (between title and buttons)

---

### 🔍 Advanced OLX Search Filters

#### New Filter Options:
1. **Price Range:**
   - Min Price input (zł)
   - Max Price input (zł)
   - Proper filtering in mock data

2. **Condition Filter:**
   - ✨ Новое (New)
   - ⭐ Как новое (Like New)
   - ✅ Хорошее (Good)
   - ⚠️ Среднее (Fair)
   - Любое (All) - default

3. **Sort Options:**
   - 🕒 Новые (Newest) - default
   - 💰 Дешевле (Price Low to High)
   - 💎 Дороже (Price High to Low)

4. **Search Query:**
   - Filter by model/specs keywords
   - Case-insensitive search
   - Enter key support for quick search

#### UI Improvements:
- **2-Row Grid Layout:** Better space utilization
- **Component Type + Search** (Row 1)
- **Min Price | Max Price | Condition | Sort** (Row 2)
- **Active Filters Display:** Blue info badge shows current filters
- **Condition Labels:** Icons + text for better UX

**Mock Data:** Expanded to 5 realistic GPU listings with various conditions

---

### 🖥️ PC Build Mode

Complete workflow for building custom PC configurations from marketplace listings.

#### Features:
1. **Build Mode Toggle:**
   - Located in header next to title
   - Shows count of selected components: `Режим сборки (3)`
   - Clear UI state: Active = filled button, Inactive = outline

2. **Component Selection:**
   - Checkboxes appear next to each search result
   - Click checkbox or + button to add component
   - Selected items highlighted with primary border + background
   - Visual feedback: ✓ checkmark when selected

3. **Build Summary Footer:**
   - **Total Price:** Sum of all selected components
   - **Component List:** Badges with title (truncated) + price
   - **Remove Button:** X icon on each badge to deselect
   - **Create Build Button:** Large, prominent, with wrench icon

4. **Build Card Creation:**
   - Type: `pc-build` (new CardType)
   - Title: `🖥️ PC Build - X компонентов`
   - Description: Markdown formatted with:
     - Total price in header
     - Component list with prices + conditions
     - Direct links to all listings
   - Checklist: Auto-generated for each component
   - Tags: `pc-build`, `olx`, `сборка`
   - Priority: High (important purchase)

5. **Smart Reset:**
   - Exit Build Mode → Selected components cleared
   - Create Build → Selections cleared + toast notification
   - Component count shown in real-time

**Use Case:** User searches for GPU, CPU, RAM → selects best deals → creates single build card → tracks purchase progress

---

### 🧠 Enhanced AI Analysis for Listings

Complete rewrite of OLX listing analysis with expert-level insights.

#### Analysis Sections:

1. **📊 Анализ цены (Price Analysis)**
   - Is this a good deal? (Yes/No with reasoning)
   - Market price range for this component
   - Comparison with new alternatives
   - Potential for negotiation

2. **⚙️ Технические характеристики (Technical Specs)**
   - Listed specifications review
   - Missing information warnings
   - Performance expectations (gaming, productivity)
   - Component relevance in 2024

3. **🚩 Красные флаги (Red Flags)**
   - Mining indicators (for GPUs)
   - Missing details that matter
   - Suspicious description patterns
   - What to check before buying

4. **✅ Рекомендация (Recommendation)**
   - Buy or pass (with rationale)
   - Negotiation advice
   - Alternative options
   - Risk assessment

#### Technical Improvements:
- **Category-Specific Context:** Helper function `getCategoryContext()` provides:
  - GPU: Market prices (RX 580: 200-300 PLN, RTX 3060: 800-1000 PLN), mining checks
  - CPU: Socket compatibility, generation info
  - RAM: Price per GB benchmarks, DDR4 vs DDR5
  - SSD: Interface types, TBW (endurance) checks

- **Expert System Prompt:** AI now acts as PC components expert, not generic assistant
- **Markdown Rendering:** Analysis displayed with ReactMarkdown + remarkGfm
  - Proper heading hierarchy
  - Bullet lists formatted correctly
  - Code blocks (if any) syntax highlighted
  - Responsive prose container

- **Visual Enhancement:** 
  - Primary-colored border + background
  - Sparkles icon with "AI Анализ экспертом" header
  - `prose prose-sm dark:prose-invert` styling
  - Mobile-friendly max-width

**Example Analysis Output:**
```markdown
## 📊 Анализ цены
Цена 250 PLN для RX 580 8GB в хорошем состоянии - справедливая. 
Рыночный диапазон: 200-300 PLN.

## ⚙️ Технические характеристики
- 8GB VRAM - достаточно для 1080p gaming
- Производительность: 60 FPS в большинстве игр на средних настройках

## 🚩 Красные флаги
⚠️ Продавец не указал, использовалась ли карта в майнинге
✅ Sapphire Nitro+ - качественная модель с хорошим охлаждением

## ✅ Рекомендация
**Покупать**, но только после проверки температур и стресс-тестов.
Можно торговаться до 230 PLN.
```

---

## 🛠️ Technical Changes

### Code Structure:
- **New CardType:** Added `'pc-build'` to `src/types/index.ts`
- **State Management:** 
  - `buildMode: boolean` - toggle state
  - `selectedComponents: SearchResult[]` - selected items
  - `minPrice, condition, sortBy` - new filter states

### Functions Added:
1. `toggleComponentSelection(result)` - add/remove from build
2. `handleCreateBuild()` - generate pc-build card
3. `getCategoryContext(category)` - AI context helper
4. `totalBuildPrice` - computed total

### Dependencies:
- `ReactMarkdown` - already installed (used in AI chat)
- `remarkGfm` - already installed
- No new npm packages required ✅

### Performance:
- Build size increased by ~8 KB (1,404.46 KB from 1,395.87 KB)
- Gzip: 420.97 KB (from 418.01 KB) - ~3 KB increase
- 0 TypeScript errors
- Mock data filtering in memory (instant)

---

## 📚 Documentation

### New File: `OLX_REAL_SEARCH_GUIDE.md`

Comprehensive 400+ line guide for production integration:

**Contents:**
1. **Overview** - Current mock data status
2. **Implementation Options:**
   - Web Scraping (Puppeteer, Cheerio, Playwright)
   - Third-Party APIs (ScraperAPI, Apify, Bright Data)
   - Official APIs (Allegro REST API - recommended)
3. **Integration Steps:**
   - Backend setup (Vercel/Netlify Functions)
   - Frontend API calls
   - Environment variables
4. **Best Practices:**
   - Rate limiting strategies
   - Caching with TTL
   - Security (API key protection, CORS)
   - Error handling & fallbacks
5. **Monitoring & Logging:**
   - Winston logging example
   - Request tracking
   - Uptime monitoring
6. **FAQ** - Common questions answered
7. **Resources** - Links to all APIs, tools, tutorials

**Key Recommendation:** Start with Allegro API (official, stable, 9000 free requests/day), then add OLX scraping if needed.

---

## 🐛 Bug Fixes

- Fixed: Model selector persists selection correctly
- Fixed: Build Mode clears selection on exit
- Fixed: Condition filter applies to all 5 mock items
- Fixed: Sort by price works ascending/descending
- Fixed: AI analysis renders markdown headers properly

---

## 🎨 UI/UX Improvements

1. **Consistent Icons:** Wrench 🔧 for Build Mode, Check ✅ for selected
2. **Color Coding:**
   - Selected components: Primary border + bg-primary/5
   - Price badges: Green (bg-green-500/10, text-green-600)
   - Condition labels: Proper emoji + text
3. **Spacing:** Footer adapts based on Build Mode state
4. **Tooltips:** Model dropdown shows speed rating
5. **Responsive:** All new components mobile-friendly

---

## 🧪 Testing

- [x] Model selector changes AI model
- [x] Build Mode selects/deselects components
- [x] Total price calculates correctly
- [x] Create Build generates proper card
- [x] Filters work independently and combined
- [x] AI analysis renders markdown
- [x] Category context includes market prices
- [x] TypeScript compilation clean
- [x] Build succeeds without errors
- [x] Git push successful

---

## 📦 Build Info

```bash
dist/index.html                     0.44 kB │ gzip:   0.28 kB
dist/assets/index-Cqu8pPlv.css     73.64 kB │ gzip:  12.87 kB
dist/assets/index-CpAHG1ck.js   1,404.46 kB │ gzip: 420.97 kB
✓ built in 10.58s
```

**Comparison to v0.4.1:**
- Bundle: +8.59 KB (0.6% increase)
- Gzip: +2.96 KB (0.7% increase)
- Build time: +0.37s
- No significant performance impact ✅

---

## 🚀 Deployment

- **Status:** ✅ Deployed to GitHub Pages
- **URL:** `https://yahor777.github.io/personal-dashboard/`
- **Commit:** `beef9fb`
- **Branch:** `main`
- **Auto-Deploy:** GitHub Actions workflow active

---

## 📝 Migration Notes

### For Users:
- No breaking changes
- Existing workspaces fully compatible
- New features available immediately
- Model selector auto-selects default (Llama 3.1 8B)

### For Developers:
- CardType enum extended with `'pc-build'`
- If you have custom card type checks, add `'pc-build'` to your switch/if statements
- `SearchResult.condition` now typed properly (string in interface, but filtered by specific values)

---

## 🔮 What's Next (v0.6.0)

Potential future improvements:

1. **Real OLX Integration:**
   - Allegro API connection
   - Serverless functions for search
   - Production-ready caching

2. **Build Compatibility Check:**
   - AI validates component compatibility
   - Socket/chipset warnings
   - Power supply wattage calculations

3. **Price Tracking:**
   - Save component prices over time
   - Alert when price drops
   - Historical price charts

4. **Image Upload for Components:**
   - Photo verification during purchase
   - Condition documentation
   - Gallery view in build cards

5. **Export Build as PDF:**
   - Shopping list format
   - Include prices, links, photos
   - Print-friendly layout

---

## 🙏 Credits

- **AI Models:** OpenRouter (Meta, Google, Mistral, Microsoft)
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Markdown:** react-markdown + remark-gfm
- **State:** Zustand
- **Build:** Vite

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Yahor777/personal-dashboard/issues)
- **Documentation:** See `README.md` and `OLX_REAL_SEARCH_GUIDE.md`
- **Demo:** Visit GitHub Pages deployment

---

**Full Changelog:** [v0.4.1...v0.5.0](https://github.com/Yahor777/personal-dashboard/compare/v0.4.1...v0.5.0)
