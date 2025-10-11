# 🔧 Как реализовать РЕАЛЬНЫЙ поиск по OLX

**Дата:** 11 октября 2025  
**Сложность:** Средняя/Высокая  
**Время:** 4-8 часов разработки  

---

## 📋 Содержание

1. [Проблема](#проблема)
2. [Решения](#решения)
3. [Вариант 1: OLX API (официальный)](#вариант-1-olx-api-официальный)
4. [Вариант 2: Web Scraping (неофициальный)](#вариант-2-web-scraping-неофициальный)
5. [Вариант 3: Готовые сервисы](#вариант-3-готовые-сервисы)
6. [Рекомендуемая архитектура](#рекомендуемая-архитектура)
7. [Пошаговая реализация](#пошаговая-реализация)
8. [Правовые вопросы](#правовые-вопросы)

---

## 🔴 Проблема

**Текущая ситуация:**
- OLXSearchPanel показывает **mock-данные** (демо результаты)
- Ссылки ведут на страницу поиска OLX, но результаты не реальные
- Нет парсинга/API интеграции

**Почему так:**
- OLX **НЕ предоставляет** публичный бесплатный API
- Web scraping нарушает Terms of Service OLX
- Требуется backend сервер (не можем парсить с фронтенда из-за CORS)

---

## ✅ Решения

### Сравнение методов:

| Метод | Сложность | Легальность | Стоимость | Надёжность |
|-------|-----------|-------------|-----------|------------|
| **OLX API** | 🟢 Низкая | ✅ Легально | 💰 Платно | ⭐⭐⭐⭐⭐ |
| **Web Scraping** | 🔴 Высокая | ⚠️ Серая зона | 🆓 Бесплатно | ⭐⭐⭐ |
| **Готовые сервисы** | 🟢 Низкая | ✅ Легально | 💰💰 Дорого | ⭐⭐⭐⭐ |

---

## 📘 Вариант 1: OLX API (официальный)

### Плюсы:
- ✅ Легально
- ✅ Стабильно (не сломается при изменении дизайна OLX)
- ✅ Официальная документация
- ✅ Поддержка от OLX

### Минусы:
- ❌ **Платно** (требуется бизнес-аккаунт)
- ❌ Нужно одобрение от OLX
- ❌ Доступ только для официальных партнёров

### Как получить:

1. **Свяжитесь с OLX:**
   - Email: api@olx.pl
   - Форма: https://www.olx.pl/kontakt/ → "Партнёрство/API"

2. **Заполните заявку:**
   - Название проекта: "Personal Dashboard App"
   - Цель использования: "Агрегация объявлений для личного пользования"
   - Ожидаемый трафик: "~100 запросов/день"

3. **Ждите одобрения:**
   - Время ответа: 1-4 недели
   - OLX может отказать (если проект некоммерческий)

4. **Получите API ключ:**
   ```
   API_KEY=your_olx_api_key_here
   API_SECRET=your_secret_here
   ```

### Пример использования:

```typescript
// src/services/olxApiService.ts
const OLX_API_URL = 'https://api.olx.pl/v1';
const API_KEY = process.env.VITE_OLX_API_KEY;

async function searchOLX(query: string, category: string): Promise<SearchResult[]> {
  const response = await fetch(`${OLX_API_URL}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      category: 'electronics/computers/components',
      location: 'poland',
      limit: 20,
    }),
  });

  const data = await response.json();
  return data.results.map(item => ({
    id: item.id,
    title: item.title,
    price: item.price.amount,
    currency: item.price.currency,
    condition: item.condition,
    location: item.location.city,
    url: item.url,
    image: item.photos[0]?.url,
    description: item.description,
  }));
}
```

**⚠️ Вероятность получить доступ: 10-30%** (OLX редко даёт API частным разработчикам)

---

## 🛠️ Вариант 2: Web Scraping (неофициальный)

### ⚠️ ВАЖНО: 
**Web scraping нарушает Terms of Service OLX!**  
Используйте только для личных проектов, не публикуйте.

### Плюсы:
- ✅ Бесплатно
- ✅ Полный контроль
- ✅ Не нужно одобрение

### Минусы:
- ❌ Нарушает TOS
- ❌ Может сломаться при изменении дизайна OLX
- ❌ Нужен backend (проблема CORS)
- ❌ OLX может заблокировать IP

### Архитектура:

```
Frontend (React)
    ↓
Backend (Node.js/Express)
    ↓
Puppeteer/Cheerio
    ↓
OLX.pl
```

### Технологии:

1. **Backend:** Node.js + Express
2. **Scraping:** 
   - `cheerio` (парсинг HTML)
   - `axios` (HTTP запросы)
   - `puppeteer` (если нужен JavaScript)

### Пошаговая реализация:

#### Шаг 1: Создать backend

```bash
mkdir olx-scraper-backend
cd olx-scraper-backend
npm init -y
npm install express cors cheerio axios
```

#### Шаг 2: Создать scraper

```javascript
// backend/scraper.js
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeOLX(query, category = 'elektronika/komputery/podzespoly') {
  const url = `https://www.olx.pl/${category}/q-${encodeURIComponent(query)}`;
  
  try {
    // Добавляем User-Agent чтобы OLX не блокировал
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Парсим карточки объявлений
    $('[data-cy="l-card"]').each((i, element) => {
      const $card = $(element);
      
      results.push({
        id: $card.attr('id') || `item-${i}`,
        title: $card.find('h6').text().trim(),
        price: parsePrice($card.find('[data-testid="ad-price"]').text()),
        location: $card.find('[data-testid="location-date"]').text().split('-')[0].trim(),
        url: 'https://www.olx.pl' + $card.find('a').attr('href'),
        image: $card.find('img').attr('src'),
        description: $card.find('p').text().trim(),
      });
    });

    return results;
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  }
}

function parsePrice(priceText) {
  const match = priceText.match(/(\d+[\s\d]*)/);
  return match ? parseInt(match[1].replace(/\s/g, '')) : 0;
}

module.exports = { scrapeOLX };
```

#### Шаг 3: Создать API endpoint

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const { scrapeOLX } = require('./scraper');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/olx/search', async (req, res) => {
  try {
    const { query, category } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await scrapeOLX(query, category);
    res.json({ results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`OLX Scraper running on http://localhost:${PORT}`);
});
```

#### Шаг 4: Запустить backend

```bash
node server.js
```

#### Шаг 5: Обновить frontend

```typescript
// src/components/OLXSearchPanel.tsx

const handleSearch = async () => {
  setIsLoading(true);
  
  try {
    // Вызываем наш backend вместо mock-данных
    const response = await fetch('http://localhost:3002/api/olx/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
        category: componentType,
      }),
    });

    const data = await response.json();
    setResults(data.results);
  } catch (error) {
    console.error('OLX search error:', error);
    toast.error('Ошибка поиска OLX');
  } finally {
    setIsLoading(false);
  }
};
```

### Проблемы и решения:

#### Проблема 1: OLX блокирует IP
**Решение:**
- Используйте прокси (платные: BrightData, ScraperAPI)
- Добавьте задержки между запросами (rate limiting)
- Ротируйте User-Agents

```javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
  // ... больше user agents
];

const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
```

#### Проблема 2: Структура HTML изменилась
**Решение:**
- Добавьте тесты для scraper
- Используйте несколько селекторов (fallback)
- Мониторьте ошибки

```javascript
// Попробовать разные селекторы
const title = 
  $card.find('h6').text() || 
  $card.find('.css-16v5mdi').text() ||
  $card.find('[data-cy="ad-title"]').text();
```

#### Проблема 3: JavaScript-рендеринг
**Решение:**
- Используйте Puppeteer (headless Chrome)

```javascript
const puppeteer = require('puppeteer');

async function scrapeWithPuppeteer(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const results = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-cy="l-card"]');
    return Array.from(cards).map(card => ({
      title: card.querySelector('h6')?.textContent,
      price: card.querySelector('[data-testid="ad-price"]')?.textContent,
      // ...
    }));
  });

  await browser.close();
  return results;
}
```

---

## 🌐 Вариант 3: Готовые сервисы

### ScraperAPI (рекомендуется)

**Что это:**
- Сервис для web scraping
- Решает проблемы с CORS, блокировками, JS-рендерингом

**Цены:**
- Free tier: 1,000 запросов/месяц
- Starter: $49/месяц (100,000 запросов)

**Использование:**

```typescript
const SCRAPER_API_KEY = 'your_key';

async function searchOLXviaScraper(query: string) {
  const olxUrl = `https://www.olx.pl/elektronika/komputery/podzespoly/q-${query}`;
  const apiUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(olxUrl)}`;
  
  const response = await fetch(apiUrl);
  const html = await response.text();
  
  // Парсим HTML с cheerio
  return parseOLXHTML(html);
}
```

**Плюсы:**
- ✅ Не нужен свой backend
- ✅ Авто-ротация IP
- ✅ Обход блокировок
- ✅ JS-рендеринг

**Минусы:**
- ❌ Платно (после free tier)

### Альтернативы:
- **BrightData:** $500+/месяц (дорого, но очень надёжно)
- **Apify:** $49/месяц (готовые акторы для OLX)
- **Oxylabs:** Enterprise решение

---

## 🏗️ Рекомендуемая архитектура

### Для production:

```
┌─────────────────┐
│   Frontend      │
│   (Vite/React)  │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│   Backend API   │
│   (Node/Express)│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌────────┐ ┌────────┐
│ Cache  │ │ Queue  │
│ (Redis)│ │(Bull)  │
└────────┘ └────┬───┘
              │
              ↓
        ┌──────────┐
        │ Scraper  │
        │Worker    │
        └────┬─────┘
             │
             ↓
        ┌──────────┐
        │  OLX.pl  │
        └──────────┘
```

### Компоненты:

1. **Frontend:** Vite + React (уже есть)
2. **Backend API:** Express.js
   - `/api/olx/search` - поиск
   - `/api/olx/listing/:id` - детали объявления
3. **Cache:** Redis
   - Кэширование результатов (TTL: 1 час)
   - Уменьшает нагрузку на OLX
4. **Queue:** Bull (на базе Redis)
   - Очередь задач scraping
   - Rate limiting (макс 10 запросов/мин)
5. **Scraper Worker:** Node.js процесс
   - Фоновая обработка запросов
   - Puppeteer для сложных страниц

---

## 🚀 Пошаговая реализация (полная)

### Этап 1: Подготовка (30 минут)

```bash
# Создать backend проект
mkdir personal-dashboard-backend
cd personal-dashboard-backend

# Инициализация
npm init -y

# Установить зависимости
npm install express cors cheerio axios redis bull dotenv
npm install -D nodemon

# Создать структуру
mkdir src
mkdir src/routes src/services src/utils
```

### Этап 2: Scraper Service (1 час)

```typescript
// src/services/olxScraper.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

interface OLXResult {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  location: string;
  url: string;
  image?: string;
  description: string;
}

export class OLXScraper {
  private readonly baseUrl = 'https://www.olx.pl';
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  async search(query: string, category: string = 'elektronika/komputery/podzespoly'): Promise<OLXResult[]> {
    const url = `${this.baseUrl}/${category}/q-${encodeURIComponent(query)}`;
    
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000,
      });

      return this.parseSearchPage(response.data);
    } catch (error) {
      console.error('Scraping error:', error);
      throw new Error('Failed to fetch OLX data');
    }
  }

  private parseSearchPage(html: string): OLXResult[] {
    const $ = cheerio.load(html);
    const results: OLXResult[] = [];

    $('[data-cy="l-card"]').each((_, element) => {
      try {
        const $card = $(element);
        const url = $card.find('a').attr('href');
        
        if (!url) return;

        results.push({
          id: this.extractId(url),
          title: $card.find('h6').text().trim(),
          price: this.parsePrice($card.find('[data-testid="ad-price"]').text()),
          currency: 'zł',
          condition: 'good', // OLX не всегда показывает состояние
          location: $card.find('[data-testid="location-date"]').text().split('-')[0].trim(),
          url: url.startsWith('http') ? url : this.baseUrl + url,
          image: $card.find('img').attr('src'),
          description: $card.find('p').text().trim(),
        });
      } catch (err) {
        console.warn('Failed to parse card:', err);
      }
    });

    return results;
  }

  private parsePrice(text: string): number {
    const match = text.match(/(\d+[\s\d]*)/);
    return match ? parseInt(match[1].replace(/\s/g, ''), 10) : 0;
  }

  private extractId(url: string): string {
    const match = url.match(/ID([a-zA-Z0-9]+)/);
    return match ? match[1] : Date.now().toString();
  }
}
```

### Этап 3: Cache Service (30 минут)

```typescript
// src/services/cacheService.ts
import Redis from 'redis';

export class CacheService {
  private client: any;

  constructor() {
    this.client = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    
    this.client.connect();
  }

  async get(key: string): Promise<any | null> {
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.client.setEx(key, ttl, JSON.stringify(value));
  }

  generateKey(query: string, filters: any): string {
    return `olx:${query}:${JSON.stringify(filters)}`;
  }
}
```

### Этап 4: API Routes (30 минут)

```typescript
// src/routes/olx.ts
import { Router } from 'express';
import { OLXScraper } from '../services/olxScraper';
import { CacheService } from '../services/cacheService';

const router = Router();
const scraper = new OLXScraper();
const cache = new CacheService();

router.post('/search', async (req, res) => {
  try {
    const { query, category, filters } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Check cache
    const cacheKey = cache.generateKey(query, filters);
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.json({ results: cached, source: 'cache' });
    }

    // Scrape OLX
    const results = await scraper.search(query, category);

    // Apply filters
    const filtered = applyFilters(results, filters);

    // Cache results
    await cache.set(cacheKey, filtered, 3600); // 1 hour

    res.json({ results: filtered, source: 'live', count: filtered.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function applyFilters(results: any[], filters: any) {
  return results.filter(item => {
    if (filters.minPrice && item.price < filters.minPrice) return false;
    if (filters.maxPrice && item.price > filters.maxPrice) return false;
    if (filters.location && item.location !== filters.location) return false;
    return true;
  });
}

export default router;
```

### Этап 5: Main Server (15 минут)

```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import olxRoutes from './routes/olx';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/olx', olxRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
```

### Этап 6: Frontend Integration (1 час)

```typescript
// src/services/olxApiService.ts
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';

export async function searchOLX(query: string, filters: any): Promise<SearchResult[]> {
  const response = await fetch(`${BACKEND_URL}/api/olx/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, filters }),
  });

  if (!response.ok) {
    throw new Error('OLX search failed');
  }

  const data = await response.json();
  return data.results;
}
```

```typescript
// src/components/OLXSearchPanel.tsx
import { searchOLX } from '../services/olxApiService';

const handleSearch = async () => {
  setIsLoading(true);
  
  try {
    const filters = {
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      condition: condition !== 'all' ? condition : undefined,
      location: location !== 'all' ? location : undefined,
    };

    const results = await searchOLX(searchQuery, filters);
    setResults(results);
    
    toast.success(`Найдено ${results.length} объявлений`);
  } catch (error) {
    toast.error('Ошибка поиска OLX');
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};
```

### Этап 7: Деплой (1-2 часа)

#### Backend → Render.com (бесплатно)

1. Создайте `render.yaml`:
```yaml
services:
  - type: web
    name: olx-scraper-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: REDIS_URL
        fromService:
          type: redis
          name: olx-cache
```

2. Push на GitHub
3. Подключите Render к репозиторию

#### Frontend → GitHub Pages (уже настроено)

Обновите `.env`:
```
VITE_BACKEND_URL=https://your-render-app.onrender.com
```

---

## ⚖️ Правовые вопросы

### Можно ли scraping OLX?

**Официальная позиция OLX:**
> "Web scraping нарушает наши Terms of Service"

**Серая зона:**
- ✅ Для **личного** использования - обычно ОК
- ❌ Для коммерческого использования - ЗАПРЕЩЕНО
- ❌ Публикация scraped данных - ЗАПРЕЩЕНО
- ❌ Перепродажа данных - ЗАПРЕЩЕНО

### Что можно:
- Парсить OLX для себя (не публично)
- Использовать данные в личных проектах
- Учебные цели

### Что нельзя:
- Создавать конкурирующий маркетплейс
- Продавать scraped данные
- Перегружать серверы OLX (DDoS)
- Обходить технические защиты

### Рекомендации:
1. **Rate limiting:** не более 10 запросов/минуту
2. **Уважение к серверам:** добавляйте задержки
3. **User-Agent:** указывайте честный UA (не маскируйтесь)
4. **Кэширование:** не запрашивайте одни и те же данные
5. **Robots.txt:** проверьте `https://www.olx.pl/robots.txt`

---

## 🎓 Заключение

### Что я рекомендую:

**Для личного проекта:**
→ **Вариант 2 (Web Scraping)** с backend на Render

**Для коммерческого проекта:**
→ **Вариант 1 (OLX API)** или **Вариант 3 (ScraperAPI)**

### Альтернативные подходы:

1. **Гибридный:**
   - Используйте mock-данные по умолчанию
   - Добавьте опцию "Enable real OLX search" в Settings
   - Пользователь сам решает запускать scraper или нет

2. **Browser Extension:**
   - Создайте расширение для Chrome/Firefox
   - Расширение парсит OLX прямо в браузере (нет CORS)
   - Отправляет данные в ваше приложение

3. **Manual Import:**
   - Пользователь копирует ссылку на OLX объявление
   - Приложение парсит эту конкретную страницу
   - Нет массового scraping → меньше проблем

---

## 📞 Помощь

Если застряли - напишите мне описание проблемы. Я помогу:
1. Настроить backend scraper
2. Интегрировать с фронтендом
3. Решить проблемы с CORS
4. Задеплоить на Render

**Удачи с интеграцией! 🚀**
