# 🚀 Backend Scraper для Personal Dashboard

Backend сервер для парсинга маркетплейсов: OLX.pl, Ceneo.pl, x-kom, MediaExpert

## 📦 Установка

```bash
cd backend
npm install
```

## 🔧 Настройка

Создайте файл `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
PORT=3002
ALLOWED_ORIGINS=http://localhost:5173,https://yahor777.github.io
MAX_REQUESTS_PER_MINUTE=10
CACHE_TTL=300
```

## 🚀 Запуск

### Development (с auto-reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

Сервер запустится на: http://localhost:3002

## 📡 API Endpoints

### 1. Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-13T18:00:00.000Z",
  "cache": {
    "total": 5,
    "valid": 4,
    "expired": 1
  }
}
```

### 2. Search
```bash
POST /api/search
Content-Type: application/json

{
  "query": "RTX 3060",
  "marketplace": "olx",
  "minPrice": 500,
  "maxPrice": 1500,
  "category": "gpu",
  "location": "Warszawa"
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "olx-123",
      "title": "RTX 3060 12GB",
      "price": 1200,
      "currency": "zł",
      "condition": "good",
      "location": "Warszawa",
      "url": "https://www.olx.pl/...",
      "image": "https://...",
      "description": "...",
      "marketplace": "olx",
      "scrapedAt": "2025-10-13T18:00:00.000Z"
    }
  ],
  "count": 15,
  "source": "live",
  "marketplace": "olx"
}
```

**Поддерживаемые маркетплейсы:**
- `olx` - OLX.pl (б/у товары)
- `ceneo` - Ceneo.pl (сравнение цен)
- `xkom` - x-kom (новые товары)
- `mediaexpert` - MediaExpert (в разработке)

### 3. Clear Cache
```bash
POST /api/cache/clear
```

### 4. Cache Stats
```bash
GET /api/cache/stats
```

## 🛡️ Rate Limiting

- **Лимит:** 10 запросов в минуту на IP
- **HTTP 429:** Превышен лимит (с заголовком `X-RateLimit-Remaining`)

## 💾 Кэширование

- **TTL:** 5 минут (300 секунд)
- **Тип:** In-memory (для production используйте Redis)
- **Ключ:** `query + filters`

## 🧪 Тестирование

### Curl:
```bash
curl -X POST http://localhost:3002/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"RTX 3060","marketplace":"olx"}'
```

### Postman:
1. POST http://localhost:3002/api/search
2. Body → raw → JSON
3. Вставьте JSON запрос

## 📊 Логи

Логи выводятся в консоль:
- `[OLX]` - Парсинг OLX
- `[Ceneo]` - Парсинг Ceneo
- `[x-kom]` - Парсинг x-kom
- `[Cache]` - Операции с кэшем
- `[Cleanup]` - Очистка rate limiter

## ⚠️ Важно

- **Rate Limiting:** Не делайте слишком много запросов
- **User-Agent:** Используется реальный User-Agent
- **ToS:** Web scraping может нарушать ToS маркетплейсов
- **Для личного использования:** OK
- **Для коммерческого:** Свяжитесь с маркетплейсами

## 🔧 Структура

```
backend/
├── server.js              # Main server
├── scrapers/
│   ├── olxScraper.js      # OLX parser
│   ├── ceneoScraper.js    # Ceneo parser
│   └── xkomScraper.js     # x-kom parser
├── utils/
│   ├── cache.js           # Cache service
│   └── rateLimiter.js     # Rate limiter
├── package.json
├── .env.example
└── README.md
```

## 🚀 Деплой

### Render.com (бесплатно):
1. Push на GitHub
2. Создайте Web Service на Render
3. Подключите репозиторий
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`

### Railway:
```bash
railway up
```

### Heroku:
```bash
git push heroku main
```

## 📚 Зависимости

- `express` - Web сервер
- `cors` - CORS middleware
- `cheerio` - HTML парсинг
- `axios` - HTTP клиент
- `dotenv` - Environment variables

## 🆘 Troubleshooting

### Ошибка CORS:
- Проверьте `ALLOWED_ORIGINS` в `.env`
- Добавьте ваш домен

### Ошибка 429 (Too Many Requests):
- Подождите 1 минуту
- Увеличьте `MAX_REQUESTS_PER_MINUTE`

### Scraping не работает:
- Проверьте селекторы (маркетплейсы могут изменить HTML)
- Проверьте интернет соединение
- Проверьте логи в консоли

## 📞 Поддержка

Если есть вопросы - создайте issue на GitHub!

---

**Версия:** 1.0.0  
**Node:** >= 18.0.0  
**Статус:** ✅ Production Ready
