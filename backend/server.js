import express from 'express';
import cors from 'cors';
import RateLimiter from './utils/rateLimiter.js';
import cache from './utils/cache.js';
import { scrapeOLXWithPuppeteer, closeBrowser as closePuppeteerBrowser } from './scrapers/olxScraperPuppeteer.js';
import { scrapeOLXWithApi } from './scrapers/olxApiClient.js';
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({
    ok: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

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

const olxSourceMode = (process.env.OLX_SOURCE || 'auto').trim().toLowerCase();
const preferOlxApi = olxSourceMode !== 'puppeteer';
const allowOlxFallback = olxSourceMode === 'auto' || olxSourceMode === 'fallback' || olxSourceMode === 'api+fallback';

async function performOlxSearch(query, options) {
  if (preferOlxApi) {
    try {
      return await scrapeOLXWithApi(query, options);
    } catch (error) {
      console.warn('[OLX API] Request failed', error?.message || error);
      if (!allowOlxFallback) {
        throw error;
      }
    }
  }

  return await withRetries(
    () => scrapeOLXWithPuppeteer(query, options),
    { retries: 1, delayMs: 1500 }
  );
}

const parseBooleanParam = (value) => {
  if (Array.isArray(value)) {
    value = value[0];
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === undefined || value === null) {
    return false;
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const parseStringParam = (value) => {
  if (Array.isArray(value)) {
    value = value[0];
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = String(value).trim();
  return normalized.length ? normalized : undefined;
};

const parseArrayParam = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (value === undefined || value === null) {
    return [];
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const parseIntegerParam = (value, fallback) => {
  if (Array.isArray(value)) {
    value = value[0];
  }
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

function prepareOlxOptions(source = {}) {
  const minPrice = parseStringParam(source.minPrice ?? source.priceFrom);
  const maxPrice = parseStringParam(source.maxPrice ?? source.priceTo);
  const location = parseStringParam(source.location) ?? 'all';
  const withDelivery = parseBooleanParam(source.withDelivery ?? source.deliveryAvailable);
  const category = parseStringParam(source.category ?? source.categoryId);
  const condition = parseStringParam(source.condition);
  const sellerType = parseStringParam(source.sellerType ?? source.offerFrom);
  const delivery = parseStringParam(source.delivery);
  const deliveryOptions = parseArrayParam(source.deliveryOptions ?? source.deliveryOption);
  const sortBy = parseStringParam(source.sortBy ?? source.sort);
  const fetchDetailsLimit = parseIntegerParam(
    source.detailLimit ?? source.details ?? source.fetchDetailsLimit,
    undefined,
  );
  const maxPages = parseIntegerParam(source.maxPages, 2);

  return {
    normalized: {
      minPrice,
      maxPrice,
      withDelivery,
      location,
      category,
      condition,
      sellerType,
      delivery,
      deliveryOptions,
      sortBy,
      fetchDetailsLimit,
      maxPages,
    },
    cacheModifiers: {
      marketplace: 'olx',
      minPrice,
      maxPrice,
      withDelivery,
      location,
      category,
      condition,
      sellerType,
      delivery,
      deliveryOptions,
      sortBy,
      maxPages,
      detailLimit: fetchDetailsLimit,
    },
  };
}

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/search', async (req, res) => {
  const {
    q = '',
    marketplace = 'olx',
  } = req.query;

  const { normalized, cacheModifiers } = prepareOlxOptions(req.query);
  const { maxPages: requestedMaxPages, ...scraperOptions } = normalized;
  const boundedMaxPages = Math.max(1, Math.min(5, requestedMaxPages || 2));

  const cacheKey = cache.generateKey(q, {
    marketplace,
    ...cacheModifiers,
    maxPages: boundedMaxPages,
  });
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ ok: true, cached: true, results: cached });
  }

  try {
    let results = [];

    if (marketplace === 'olx') {
      results = await performOlxSearch(q, {
        ...scraperOptions,
        maxPages: boundedMaxPages,
      });
    } else if (marketplace === 'xkom') {
      results = await scrapeXkom(q, { minPrice: scraperOptions.minPrice, maxPrice: scraperOptions.maxPrice });
    } else if (marketplace === 'ceneo') {
      results = await scrapeCeneo(q, { minPrice: scraperOptions.minPrice, maxPrice: scraperOptions.maxPrice });
    } else {
      return res.status(400).json({ ok: false, error: 'Unsupported marketplace' });
    }

    cache.set(cacheKey, results, cacheTTL);
    return res.json({ ok: true, cached: false, results });
  } catch (error) {
    return respondSearchError(res, error);
  }
});

// Дополнительный POST-маршрут для совместимости с фронтендом
app.post('/api/search', async (req, res) => {
  const q = req.body?.query ?? req.body?.q ?? '';
  const marketplace = req.body?.marketplace ?? 'olx';
  const { normalized, cacheModifiers } = prepareOlxOptions(req.body ?? {});
  const { maxPages: requestedMaxPages, ...scraperOptions } = normalized;
  const boundedMaxPages = Math.max(1, Math.min(5, requestedMaxPages || 2));

  const cacheKey = cache.generateKey(q, {
    marketplace,
    ...cacheModifiers,
    maxPages: boundedMaxPages,
  });
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ ok: true, cached: true, results: cached });
  }

  try {
    let results = [];

    if (marketplace === 'olx') {
      results = await performOlxSearch(q, {
        ...scraperOptions,
        maxPages: boundedMaxPages,
      });
    } else if (marketplace === 'xkom') {
      results = await scrapeXkom(q, { minPrice: scraperOptions.minPrice, maxPrice: scraperOptions.maxPrice });
    } else if (marketplace === 'ceneo') {
      results = await scrapeCeneo(q, { minPrice: scraperOptions.minPrice, maxPrice: scraperOptions.maxPrice });
    } else {
      return res.status(400).json({ ok: false, error: 'Unsupported marketplace' });
    }

    cache.set(cacheKey, results, cacheTTL);
    return res.json({ ok: true, cached: false, results });
  } catch (error) {
    return respondSearchError(res, error);
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ ok: false, error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(async () => {
    try {
      await closePuppeteerBrowser();
    } catch (_) {
      // ignore shutdown errors
    }
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(async () => {
    try {
      await closePuppeteerBrowser();
    } catch (_) {
      // ignore shutdown errors
    }
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});

function respondSearchError(res, error) {
  console.error('[API /api/search] Error:', error);
  const isAntibot = error?.code === 'OLX_ANTIBOT_BLOCKED' || error?.code === 'OLX_API_FORBIDDEN';
  const status = isAntibot ? 503 : 500;
  return res.status(status).json({
    ok: false,
    error: error?.message || 'Internal Error',
    code: error?.code,
  });
}

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
