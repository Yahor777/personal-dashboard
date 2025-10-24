import express from 'express';
import cors from 'cors';
import RateLimiter from './utils/rateLimiter.js';
import cache from './utils/cache.js';
import { scrapeOLXWithPuppeteer, closeBrowser as closePuppeteerBrowser } from './scrapers/olxScraperPuppeteer.js';
import scrapeXkom from './scrapers/xkomScraper.js';
import scrapeCeneo from './scrapers/ceneoScraper.js';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// Rate Limiter
const maxPerMinute = parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '60', 10);
const limiter = new RateLimiter(maxPerMinute);
app.use((req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  const { allowed, waitTime, remaining } = limiter.checkLimit(Array.isArray(ip) ? ip[0] : ip);
  res.setHeader('X-RateLimit-Limit', String(limiter.maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  if (!allowed) {
    return res.status(429).json({ ok: false, error: `Rate limit exceeded. Try again in ${waitTime}s` });
  }
  return next();
});
// Optional periodic cleanup
setInterval(() => limiter.cleanup(), 30_000).unref();

// Cache TTL from env
const cacheTTL = parseInt(process.env.CACHE_TTL || '120', 10);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/search', async (req, res) => {
  const {
    q = '',
    marketplace = 'olx',
    minPrice,
    maxPrice,
    withDelivery,
    location = 'all',
    maxPages = '2',
  } = req.query;

  const cacheKey = cache.generateKey(q, { marketplace, minPrice, maxPrice, withDelivery, location, maxPages });
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ ok: true, cached: true, results: cached });
  }

  try {
    let results = [];

    if (marketplace === 'olx') {
      // Встроенный ретрай запроса к скраперу для стабильности
      results = await withRetries(
        () => scrapeOLXWithPuppeteer(q, {
          minPrice,
          maxPrice,
          withDelivery: String(withDelivery) === 'true' || withDelivery === '1',
          location,
          maxPages: Math.max(1, Math.min(5, parseInt(maxPages, 10) || 2)),
        }),
        { retries: 1, delayMs: 1500 }
      );
    } else if (marketplace === 'xkom') {
      results = await scrapeXkom(q, { minPrice, maxPrice });
    } else if (marketplace === 'ceneo') {
      results = await scrapeCeneo(q, { minPrice, maxPrice });
    } else {
      return res.status(400).json({ ok: false, error: 'Unsupported marketplace' });
    }

    cache.set(cacheKey, results, cacheTTL);
    return res.json({ ok: true, cached: false, results });
  } catch (error) {
    console.error('[API /api/search] Error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Internal Error' });
  }
});

// Дополнительный POST-маршрут для совместимости с фронтендом
app.post('/api/search', async (req, res) => {
  const q = req.body?.query ?? req.body?.q ?? '';
  const marketplace = req.body?.marketplace ?? 'olx';
  const minPrice = req.body?.minPrice;
  const maxPrice = req.body?.maxPrice;
  const withDelivery = req.body?.withDelivery;
  const location = req.body?.location ?? 'all';
  const maxPages = String(req.body?.maxPages ?? '2');

  const cacheKey = cache.generateKey(q, { marketplace, minPrice, maxPrice, withDelivery, location, maxPages });
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ ok: true, cached: true, results: cached });
  }

  try {
    let results = [];

    if (marketplace === 'olx') {
      results = await withRetries(
        () => scrapeOLXWithPuppeteer(q, {
          minPrice,
          maxPrice,
          withDelivery: String(withDelivery) === 'true' || withDelivery === '1',
          location,
          maxPages: Math.max(1, Math.min(5, parseInt(maxPages, 10) || 2)),
        }),
        { retries: 1, delayMs: 1500 }
      );
    } else if (marketplace === 'xkom') {
      results = await scrapeXkom(q, { minPrice, maxPrice });
    } else if (marketplace === 'ceneo') {
      results = await scrapeCeneo(q, { minPrice, maxPrice });
    } else {
      return res.status(400).json({ ok: false, error: 'Unsupported marketplace' });
    }

    cache.set(cacheKey, results, cacheTTL);
    return res.json({ ok: true, cached: false, results });
  } catch (error) {
    console.error('[API /api/search] Error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Internal Error' });
  }
});

// Грейсфул-шатдаун: корректно закрываем браузер Puppeteer
async function gracefulShutdown(signal) {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
  try {
    await closePuppeteerBrowser();
  } catch (e) {
    console.warn('[Server] Error closing Puppeteer:', e?.message || e);
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});

// Общий ретрай хелпер
async function withRetries(fn, { retries = 1, delayMs = 1000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastErr;
}
