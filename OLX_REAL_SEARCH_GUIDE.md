# 🔍 OLX Real Search Integration Guide

> **Текущий статус:** Приложение использует mock данные для демонстрации функциональности OLX поиска.  
> Для продакшна нужно подключить реальный парсинг или API.

---

## 📋 Обзор

OLX Search Panel (`src/components/OLXSearchPanel.tsx`) предоставляет интерфейс для поиска компьютерных компонентов на OLX и Allegro. Сейчас используются mock данные, но архитектура готова для интеграции реального поиска.

### Текущая функциональность (Mock)
- ✅ Фильтры: категория компонента, поиск по модели, диапазон цен, состояние, сортировка
- ✅ Режим сборки ПК с выбором нескольких компонентов
- ✅ AI анализ объявлений с рекомендациями
- ✅ Добавление находок на Kanban доску
- ✅ Responsive UI с реалистичными результатами

---

## 🛠️ Варианты реализации реального поиска

### Вариант 1: Web Scraping (самый простой)

**Подход:** Парсинг HTML страниц OLX/Allegro через библиотеки

**Преимущества:**
- Не требует официальных API ключей
- Полный контроль над данными
- Бесплатно

**Недостатки:**
- Может нарушать ToS платформ
- HTML структура может измениться (нужна поддержка)
- Требует обход CAPTCHA и rate limiting
- Нужен прокси для большого количества запросов

**Технологии:**
```typescript
// Backend (Node.js/Deno)
import * as cheerio from 'cheerio';
import axios from 'axios';

async function searchOLX(query: string, category: string) {
  const url = `https://www.olx.pl/elektronika/komputery/podzespoly/`;
  const response = await axios.get(url, {
    params: { search: query },
    headers: {
      'User-Agent': 'Mozilla/5.0...',
    },
  });
  
  const $ = cheerio.load(response.data);
  
  const results = [];
  $('.css-1sw7q4x').each((i, el) => {
    const title = $(el).find('h6').text();
    const price = $(el).find('.css-10b0gli').text();
    const url = $(el).find('a').attr('href');
    // ... парсинг остальных полей
    results.push({ title, price, url });
  });
  
  return results;
}
```

**Рекомендуемые библиотеки:**
- **Puppeteer** - для JavaScript рендеринга (если OLX использует React)
- **Cheerio** - для парсинга статического HTML
- **Playwright** - современная альтернатива Puppeteer
- **Bright Data / ScrapingBee** - прокси сервисы с обходом CAPTCHA

---

### Вариант 2: Unofficial API / Third-Party Services

**Подход:** Использование неофициальных API или сервисов-посредников

**Сервисы:**
1. **ScraperAPI** (scraperapi.com) - $49/mo за 100K запросов
2. **Apify** (apify.com) - готовые актеры для OLX
3. **Bright Data** - enterprise решение

**Пример с ScraperAPI:**
```typescript
const SCRAPER_API_KEY = 'your_key';

async function searchWithAPI(url: string) {
  const apiUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
  const response = await fetch(apiUrl);
  return response.text();
}
```

---

### Вариант 3: Official APIs (рекомендуется)

**OLX:**
- ❌ OLX НЕ предоставляет публичный API для разработчиков
- ⚠️ Есть внутренний API (используется мобильными приложениями), но он закрыт
- 💡 Можно попробовать связаться с OLX для партнерского доступа

**Allegro:**
- ✅ У Allegro есть официальный REST API!
- 📚 Документация: https://developer.allegro.pl/
- 🔑 Требуется регистрация приложения
- ⚡ Бесплатный tier: 9000 запросов/день

**Пример Allegro API:**
```typescript
const CLIENT_ID = 'your_client_id';
const CLIENT_SECRET = 'your_client_secret';

async function getAllegroToken() {
  const response = await fetch('https://allegro.pl/auth/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  return data.access_token;
}

async function searchAllegro(query: string, token: string) {
  const response = await fetch(
    `https://api.allegro.pl/offers/listing?phrase=${encodeURIComponent(query)}&category.id=12345`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.allegro.public.v1+json',
      },
    }
  );
  
  const data = await response.json();
  return data.items.promoted; // Список объявлений
}
```

---

## 🔧 Интеграция в проект

### Шаг 1: Создать Backend API

Так как OLX/Allegro поиск требует серверной логики (обход CORS, хранение ключей), нужен backend:

**Варианты:**
1. **Vercel/Netlify Functions** (serverless)
2. **Express.js server** (VPS/Heroku)
3. **Cloudflare Workers** (edge computing)
4. **Supabase Edge Functions** (если используете Supabase)

**Пример Vercel Function:**
```typescript
// api/search-olx.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { query, category, minPrice, maxPrice } = req.query;
  
  // Ваша логика парсинга OLX
  const results = await searchOLX(query as string, category as string);
  
  res.json({ results });
}
```

### Шаг 2: Обновить Frontend

В `src/components/OLXSearchPanel.tsx` замените mock данные на реальный API:

```typescript
const handleSearch = async () => {
  setIsLoading(true);
  
  try {
    const params = new URLSearchParams({
      query: searchQuery,
      category: componentType,
      minPrice: minPrice || '0',
      maxPrice: maxPrice || '999999',
      condition,
      sortBy,
    });
    
    const response = await fetch(`/api/search-olx?${params}`);
    const data = await response.json();
    
    setResults(data.results);
  } catch (error) {
    console.error('Search error:', error);
    toast.error('Ошибка поиска. Попробуйте снова.');
  } finally {
    setIsLoading(false);
  }
};
```

### Шаг 3: Добавить Environment Variables

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3000
SCRAPER_API_KEY=your_scraper_api_key
ALLEGRO_CLIENT_ID=your_allegro_client_id
ALLEGRO_CLIENT_SECRET=your_allegro_client_secret
```

---

## ⚡ Rate Limiting & Caching

Для предотвращения блокировок и экономии запросов:

```typescript
// Simple in-memory cache (для serverless используйте Redis/KV)
const cache = new Map<string, { data: any; expires: number }>();

function getCached(key: string) {
  const item = cache.get(key);
  if (item && item.expires > Date.now()) {
    return item.data;
  }
  return null;
}

function setCache(key: string, data: any, ttlMs: number = 60000) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

// В handleSearch:
const cacheKey = `search:${query}:${category}:${minPrice}:${maxPrice}`;
const cached = getCached(cacheKey);
if (cached) return cached;

const results = await searchOLX(...);
setCache(cacheKey, results);
```

---

## 🛡️ Безопасность

1. **НИКОГДА не храните API ключи в frontend коде**
2. Используйте environment variables
3. Добавьте rate limiting на backend (express-rate-limit)
4. Валидируйте входные данные
5. Используйте HTTPS для всех запросов
6. Добавьте CORS правила

```typescript
// Backend rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // лимит 100 запросов на IP
  message: 'Слишком много запросов, попробуйте позже',
});

app.use('/api/search-olx', limiter);
```

---

## 📊 Мониторинг

Отслеживайте использование API:

```typescript
// Логирование запросов
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.File({ filename: 'search.log' })],
});

logger.info('OLX search', {
  query,
  resultCount: results.length,
  duration: Date.now() - startTime,
});
```

---

## 🚀 Рекомендуемая стратегия запуска

**Phase 1: MVP (текущее состояние)**
- ✅ Mock данные работают
- ✅ UI полностью готов
- ✅ AI анализ функционирует
- 👉 **Запускайте как есть для демо/тестирования**

**Phase 2: Allegro Integration**
- Зарегистрируйте приложение на Allegro API
- Создайте Vercel Function для поиска
- Протестируйте на небольшом количестве запросов
- Добавьте error handling

**Phase 3: OLX Parsing (опционально)**
- Настройте web scraping с Puppeteer
- Используйте прокси (Bright Data / ScraperAPI)
- Добавьте мониторинг изменений HTML структуры
- Реализуйте fallback на Allegro при ошибках

**Phase 4: Production Optimization**
- Внедрите кеширование (Redis)
- Настройте очередь запросов (Bull/BullMQ)
- Добавьте аналитику использования
- Мониторинг (Sentry, LogRocket)

---

## 📚 Полезные ресурсы

### OLX
- [OLX.pl](https://www.olx.pl/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Cheerio Documentation](https://cheerio.js.org/)

### Allegro
- [Allegro API Docs](https://developer.allegro.pl/)
- [Allegro REST API Tutorial](https://developer.allegro.pl/tutorials/)
- [Authentication Guide](https://developer.allegro.pl/auth/)

### Web Scraping Tools
- [ScraperAPI](https://www.scraperapi.com/)
- [Apify](https://apify.com/)
- [Bright Data](https://brightdata.com/)
- [Playwright](https://playwright.dev/)

### Serverless Platforms
- [Vercel Functions](https://vercel.com/docs/functions)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 💡 Tips & Best Practices

1. **Начните с Allegro API** - это законно и стабильно
2. **Используйте кеширование агрессивно** - OLX объявления не меняются каждую секунду
3. **Добавьте pagination** - не загружайте 1000 результатов сразу
4. **Обработка ошибок** - всегда имейте fallback
5. **User-Agent rotation** - при scraping'е меняйте User-Agent
6. **Respects robots.txt** - проверьте `https://www.olx.pl/robots.txt`
7. **Мониторинг uptime** - OLX может изменить структуру сайта
8. **Локальное тестирование** - тестируйте парсинг локально перед deploy

---

## ❓ FAQ

**Q: Могу ли я использовать CORS Proxy для OLX?**
A: Технически да, но это нарушает ToS и ненадежно. Лучше использовать backend.

**Q: Сколько запросов в секунду безопасно для OLX?**
A: Рекомендуется не более 1-2 запросов/сек. Используйте delays между запросами.

**Q: Нужен ли VPN/Proxy?**
A: Для production scraping - да. Для тестирования - нет.

**Q: Как обойти CAPTCHA?**
A: Используйте ScraperAPI, 2Captcha, или anti-captcha сервисы.

**Q: Можно ли кешировать результаты?**
A: Да, 5-15 минут кеш вполне безопасен для большинства запросов.

---

## 🎯 Conclusion

Mock данные позволяют полностью протестировать UX и функциональность приложения. Для production интеграции **рекомендуется начать с Allegro API** (официальный, стабильный, бесплатный tier), а затем, при необходимости, добавить OLX scraping с помощью Puppeteer + proxy сервиса.

---

**Последнее обновление:** 2024
**Статус:** Ready for Production (с mock данными) | Ready to integrate APIs
