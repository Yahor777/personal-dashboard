# 🏪 OLX Integration Guide

Этот файл объясняет, как подключить реальный поиск по OLX/Allegro.

## 🎯 Текущее состояние

В данный момент OLXSearchPanel использует **mock данные** для демонстрации функциональности.

## 🔧 Варианты интеграции

### Вариант 1: Ollama + Web Scraping (Локально)

**Преимущества:** Бесплатно, работает без API ключей

**Как сделать:**

1. Установите Ollama и модель с vision:
```bash
ollama pull llama3
```

2. Создайте простой парсер:
```typescript
// utils/olxParser.ts
export async function searchOLX(query: string, maxPrice?: number) {
  const url = `https://www.olx.pl/elektronika/komputery/podzespoly-komputerowe/?search%5Bfilter_float_price%3Ato%5D=${maxPrice}&q=${encodeURIComponent(query)}`;
  
  // Используйте CORS proxy для обхода ограничений
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  
  const response = await fetch(proxyUrl);
  const html = await response.text();
  
  // Парсинг HTML (нужна библиотека типа cheerio или DOMParser)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Извлечение данных
  const listings = doc.querySelectorAll('[data-cy="l-card"]');
  
  return Array.from(listings).map((listing) => ({
    title: listing.querySelector('h6')?.textContent,
    price: parseFloat(listing.querySelector('[data-testid="ad-price"]')?.textContent || '0'),
    url: listing.querySelector('a')?.href,
    // ... другие поля
  }));
}
```

3. Вызывайте в `OLXSearchPanel.tsx`:
```typescript
const handleSearch = async () => {
  setIsLoading(true);
  try {
    const results = await searchOLX(searchQuery, maxPrice ? parseInt(maxPrice) : undefined);
    setResults(results);
  } catch (error) {
    console.error('OLX search error:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### Вариант 2: Serpstack API (Облачный)

**Преимущества:** Надёжно, легко настроить

**Стоимость:** $29.99/мес (1000 запросов)

```typescript
// utils/serpstackSearch.ts
export async function searchOLXViaSerpstack(query: string) {
  const API_KEY = 'your_serpstack_key';
  const url = `http://api.serpstack.com/search?access_key=${API_KEY}&query=${encodeURIComponent(query + ' site:olx.pl')}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data.organic_results.map((result: any) => ({
    title: result.title,
    url: result.url,
    snippet: result.snippet,
  }));
}
```

### Вариант 3: OpenRouter + GPT-4o (AI парсинг)

**Преимущества:** Умный анализ, извлечение структурированных данных

```typescript
// utils/aiOLXSearch.ts
export async function searchOLXWithAI(query: string, apiKey: string) {
  const prompt = `
    Найди на olx.pl товары по запросу: "${query}"
    
    Верни JSON массив с полями:
    - title (название)
    - price (цена в zł)
    - condition (состояние)
    - location (город)
    - url (ссылка)
  `;
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

### Вариант 4: Browser Extension (Самый простой)

Создайте расширение для Chrome/Firefox:

```javascript
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'searchOLX') {
    fetch('https://www.olx.pl/...')
      .then(response => response.text())
      .then(html => {
        // Парсинг
        sendResponse({ results: parsedResults });
      });
  }
  return true;
});
```

В MySpaceHub:
```typescript
// Проверка расширения
if (chrome?.runtime?.sendMessage) {
  chrome.runtime.sendMessage(EXTENSION_ID, { action: 'searchOLX', query }, (response) => {
    setResults(response.results);
  });
}
```

## 🔄 Обновление текущего кода

Замените mock функцию в `/components/OLXSearchPanel.tsx`:

```typescript
const handleSearch = async () => {
  setIsLoading(true);
  
  try {
    // ❌ Удалите это:
    // setTimeout(() => { ... }, 1500);
    
    // ✅ Добавьте реальный поиск:
    const results = await searchOLX(searchQuery, maxPrice ? parseInt(maxPrice) : undefined);
    setResults(results);
  } catch (error) {
    console.error('Search error:', error);
    // Показать ошибку пользователю
  } finally {
    setIsLoading(false);
  }
};
```

## 🛡️ CORS и безопасность

### Проблема CORS

OLX блокирует прямые запросы из браузера. Решения:

1. **CORS Proxy** (для dev):
```typescript
const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(olxUrl)}`;
```

2. **Backend proxy** (для production):
```typescript
// На вашем сервере (Node.js/Express)
app.get('/api/olx-search', async (req, res) => {
  const url = `https://olx.pl/...?q=${req.query.q}`;
  const response = await fetch(url);
  const html = await response.text();
  res.send(html);
});
```

3. **Cloudflare Worker** (serverless):
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const olxUrl = url.searchParams.get('url');
  
  const response = await fetch(olxUrl);
  return new Response(await response.text(), {
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}
```

## 📊 Rate Limiting

Ограничьте частоту запросов:

```typescript
// utils/rateLimiter.ts
let lastRequest = 0;
const MIN_DELAY = 1000; // 1 секунда

export function rateLimitedFetch(url: string) {
  const now = Date.now();
  const delay = Math.max(0, MIN_DELAY - (now - lastRequest));
  
  return new Promise((resolve) => {
    setTimeout(async () => {
      lastRequest = Date.now();
      const response = await fetch(url);
      resolve(response);
    }, delay);
  });
}
```

## 🧪 Тестирование

Создайте mock сервер для тестов:

```typescript
// __mocks__/olxApi.ts
export const mockOLXResults = [
  {
    id: '1',
    title: 'RX 580 8GB',
    price: 250,
    currency: 'zł',
    condition: 'Używane',
    location: 'Warszawa',
    url: 'https://olx.pl/test',
  },
];
```

## 📚 Дополнительные ресурсы

- [AllOrigins CORS Proxy](https://allorigins.win/)
- [Serpstack API](https://serpstack.com/)
- [OpenRouter](https://openrouter.ai/)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)

## ⚠️ Юридические аспекты

**Важно:** Web scraping может нарушать Terms of Service OLX/Allegro.

**Рекомендации:**
- Используйте умеренный rate limiting
- Добавьте User-Agent header
- Не перепродавайте данные
- Для коммерческого использования — свяжитесь с OLX API team

## 🎯 Рекомендуемый подход

Для личного использования:
1. Начните с **Ollama + CORS proxy**
2. Добавьте кэширование результатов
3. Ограничьте до 10 запросов/час

Для production:
1. Используйте **официальный OLX API** (если доступен)
2. Или **Serpstack** для надёжности
3. Добавьте **backend proxy** для безопасности

---

**MySpaceHub** — умный поиск компонентов! 🚀
