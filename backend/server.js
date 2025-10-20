import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scrapeOLX } from './scrapers/olxScraper.js';
import { scrapeOLXWithPuppeteer } from './scrapers/olxScraperPuppeteer.js';
import { scrapeCeneo } from './scrapers/ceneoScraper.js';
import { scrapeXkom } from './scrapers/xkomScraper.js';
import cache from './utils/cache.js';
import RateLimiter from './utils/rateLimiter.js';
import { generateProducts } from './utils/aiProductGenerator.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const rateLimiter = new RateLimiter(parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 10);

// Middleware
app.use(express.json());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://yahor777.github.io'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting middleware
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const limitCheck = rateLimiter.checkLimit(ip);

  if (!limitCheck.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please wait ${limitCheck.waitTime} seconds.`,
      waitTime: limitCheck.waitTime,
    });
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Remaining', limitCheck.remaining);
  next();
});

// Health check
app.get('/health', (req, res) => {
  const cacheStats = cache.stats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: cacheStats,
  });
});

// Search endpoint (POST)
app.post('/api/search', async (req, res) => {
  try {
    const { query, marketplace, minPrice, maxPrice, category, location, withDelivery } = req.body;

    // Validation
    if (!marketplace) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'marketplace is required',
      });
    }
    
    // Query может быть пустым - показываем все результаты
    const searchQuery = query || '';

    // Generate cache key
    const cacheKey = cache.generateKey(query, { marketplace, minPrice, maxPrice, category, location, withDelivery });
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({
        results: cached,
        count: cached.length,
        source: 'cache',
        marketplace,
      });
    }

    // Scrape based on marketplace
    let results = [];
    const options = { minPrice, maxPrice, category, location, withDelivery, maxPages: 3 };

    switch (marketplace) {
      case 'olx':
        // 🌐 РЕАЛЬНЫЙ ПАРСИНГ OLX
        console.log('[Server] OLX: Real scraping with Puppeteer...');
        results = await scrapeOLXWithPuppeteer(searchQuery, options);
        
        if (!results || results.length === 0) {
          console.log('[Server] ⚠️ No results from Puppeteer - check selectors!');
        }
        break;
      case 'ceneo':
        results = await scrapeCeneo(searchQuery, options);
        break;
      case 'xkom':
        results = await scrapeXkom(searchQuery, options);
        break;
      case 'mediaexpert':
        // TODO: Implement MediaExpert scraper
        results = [];
        break;
      default:
        return res.status(400).json({
          error: 'Invalid marketplace',
          message: `Marketplace "${marketplace}" is not supported`,
        });
    }

    // Apply additional filters
    results = applyFilters(results, { minPrice, maxPrice, location });

    // Cache results
    const cacheTTL = parseInt(process.env.CACHE_TTL) || 300;
    cache.set(cacheKey, results, cacheTTL);

    res.json({
      results,
      count: results.length,
      source: 'live',
      marketplace,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message,
    });
  }
});

// Clear cache endpoint (for admin/debugging)
app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared' });
});

// Cache stats endpoint
app.get('/api/cache/stats', (req, res) => {
  const stats = cache.stats();
  res.json(stats);
});

/**
 * Apply filters to results
 */
function applyFilters(results, filters) {
  const { minPrice, maxPrice, location } = filters;

  return results.filter(item => {
    // Price filter
    if (minPrice && item.price < parseInt(minPrice)) return false;
    if (maxPrice && item.price > parseInt(maxPrice)) return false;
    
    // Location filter (for OLX)
    if (location && location !== 'all' && item.location !== location) return false;
    
    return true;
  });
}

// Cleanup rate limiter every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
  console.log('[Cleanup] Rate limiter cleaned up');
}, 5 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Backend server running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/health
🔍 Search: POST http://localhost:${PORT}/api/search
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
