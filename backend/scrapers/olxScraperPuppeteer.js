import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

// Используем stealth plugin для обхода detection
puppeteer.use(StealthPlugin());

/**
 * 🌐 OLX Scraper with Puppeteer + Stealth (Real Browser)
 * Парсит РЕАЛЬНЫЕ объявления с OLX.pl используя headless браузер
 * + Обход detection с помощью stealth plugin
 */

let browser = null;
let browserLaunchPromise = null;

// Минимальный пул user-agent строк (ротация для стабильности)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

function pickUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getProxyArg() {
  const proxy = process.env.PROXY_SERVER || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  return proxy ? [`--proxy-server=${proxy}`] : [];
}

const DEBUG = (process.env.SCRAPER_DEBUG || '').toLowerCase() === 'true';

const CONDITION_PARAM_MAP = {
  new: 'new',
  used: 'used',
  refurbished: 'refurbished',
  renewed: 'renewed',
  damaged: 'damaged',
  parts: 'for_parts',
  'for-parts': 'for_parts',
};

const SELLER_TYPE_PARAM_MAP = {
  private: 'private',
  individual: 'private',
  person: 'private',
  business: 'company',
  company: 'company',
  dealer: 'company',
};

const DELIVERY_PARAM_MAP = {
  courier: 'courier',
  shipping: 'courier',
  parcel: 'parcel',
  parcel_locker: 'parcel',
  'parcel-locker': 'parcel',
  parcelLocker: 'parcel',
  olx_delivery: 'olx_delivery',
  olx: 'olx_delivery',
  pickup: 'selfpickup',
  selfpickup: 'selfpickup',
  personal: 'selfpickup',
};

const SORT_PARAM_MAP = {
  newest: 'created_at:desc',
  recent: 'created_at:desc',
  oldest: 'created_at:asc',
  cheapest: 'price:asc',
  expensive: 'price:desc',
  price_asc: 'price:asc',
  price_desc: 'price:desc',
  relevance: 'relevance:desc',
};

const DEFAULT_DETAIL_LIMIT = 20;

/**
 * Получить или запустить браузер
 */
async function getBrowser() {
  if (browser && browser.connected) {
    return browser;
  }

  // Если браузер уже запускается, ждём
  if (browserLaunchPromise) {
    return await browserLaunchPromise;
  }

  console.log('[Puppeteer+Stealth] Launching browser with stealth mode...');
  
  browserLaunchPromise = puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      ...getProxyArg(),
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    ignoreHTTPSErrors: true,
  });

  try {
    browser = await browserLaunchPromise;
    console.log('[Puppeteer] Browser launched successfully');
    
    // Обработка закрытия браузера
    browser.on('disconnected', () => {
      console.log('[Puppeteer] Browser disconnected');
      browser = null;
      browserLaunchPromise = null;
    });
    
    return browser;
  } catch (error) {
    console.error('[Puppeteer] Failed to launch browser:', error);
    browserLaunchPromise = null;
    throw error;
  }
}

/**
 * 🔍 Главная функция парсинга
 */
export async function scrapeOLXWithPuppeteer(query, options = {}) {
  const {
    maxPages = 3,
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
    maxDetails,
    detailConcurrency,
    concurrency,
  } = options;

  const normalizedOptions = {
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
  };

  const detailOptions = {
    maxDetails: fetchDetailsLimit ?? maxDetails ?? DEFAULT_DETAIL_LIMIT,
    concurrency: detailConcurrency ?? concurrency ?? 3,
  };

  console.log(`[Puppeteer OLX] Starting scrape for: "${query}"`);
  console.log(`[Puppeteer OLX] Will parse up to ${maxPages} pages`);
  
  const allResults = [];
  
  try {
    const browserInstance = await getBrowser();
    
    // Парсим несколько страниц с ретраями
    for (let page = 1; page <= maxPages; page++) {
      try {
        const pageResults = await withRetries(
          () => scrapePage(browserInstance, query, page, normalizedOptions),
          { retries: 2, delayMs: 2000 }
        );
        allResults.push(...pageResults);
        
        console.log(`[Puppeteer OLX] Page ${page}/${maxPages}: found ${pageResults.length} listings (total: ${allResults.length})`);
        
        // Если на странице меньше 5 результатов - это последняя страница
        if (pageResults.length < 5) {
          console.log(`[Puppeteer OLX] Last page reached`);
          break;
        }
        
        // Задержка между страницами
        if (page < maxPages) {
          await sleep(1500);
        }
        
      } catch (error) {
        console.error(`[Puppeteer OLX] Error on page ${page}:`, error.message);
        if (page === 1) throw error;
        break;
      }
    }

    const uniqueMap = new Map();
    for (const listing of allResults) {
      const key = listing.id || listing.url;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, listing);
      }
    }
    const uniqueResults = Array.from(uniqueMap.values());

    const enrichedResults = await enrichListingDetails(uniqueResults, detailOptions);
    
    console.log(`[Puppeteer OLX] ✅ COMPLETE: ${enrichedResults.length} total listings returned`);
    return enrichedResults;
    
  } catch (error) {
    const isAntibot = typeof error?.message === 'string' && error.message.startsWith('OLX_ANTIBOT');
    if (isAntibot) {
      console.error('[Puppeteer OLX] Blocked by OLX anti-bot. Consider enabling a proxy or waiting before retrying.');
      const friendly = new Error('OLX blocked the scraper (anti-bot protection). Try again later or configure a proxy.');
      friendly.code = 'OLX_ANTIBOT_BLOCKED';
      throw friendly;
    }
    console.error('[Puppeteer OLX] Scraping failed:', error);
    throw error;
  }
}

/**
 * 📄 Парсинг одной страницы
 */
async function scrapePage(browserInstance, query, pageNumber, options) {
  // Prefer fresh incognito contexts if the current Puppeteer build exposes them; otherwise fall back to plain pages.
  const createContext = typeof browserInstance.createIncognitoBrowserContext === 'function'
    ? () => browserInstance.createIncognitoBrowserContext()
    : (typeof browserInstance.createBrowserContext === 'function'
        ? () => browserInstance.createBrowserContext()
        : null);

  const context = createContext ? await createContext() : null;
  const page = context ? await context.newPage() : await browserInstance.newPage();
  
  try {
    // Устанавливаем реалистичный User-Agent
    await page.setUserAgent(pickUA());
    
    // Устанавливаем дополнительные заголовки
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    });
    
    // НЕ блокируем изображения - они нужны!
    // Только блокируем тяжелые ресурсы
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    if (pageNumber === 1) {
      await prepareSession(page);
    } else {
      await randomizedPause(page, 400, 900);
    }
    
    // Строим URL
    const url = buildOLXUrl(query, pageNumber, options);
    console.log(`[Puppeteer OLX] Navigating to: ${url}`);
    
    // Переходим на страницу; при антиботе выходим сразу, без агрессивных повторов
    let navAttempt = 0;
    const maxNavAttempts = 2;
    while (true) {
      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await randomizedPause(page, 900, 1800);
        if (await detectAntiBot(page)) {
          throw new Error('OLX_ANTIBOT_DETECTED');
        }
        break;
      } catch (err) {
        navAttempt += 1;
        const isAntibot = typeof err?.message === 'string' && err.message.startsWith('OLX_ANTIBOT');
        if (isAntibot) {
          throw err;
        }
        if (navAttempt > maxNavAttempts) {
          throw err;
        }
        await randomizedPause(page, 1500, 2600);
      }
    }
    
    // Проверка антибот/капча
    if (await detectAntiBot(page)) {
      console.warn('[Puppeteer OLX] Anti-bot detected; waiting and retrying once...');
      await sleep(3500);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await randomizedPause(page, 600, 1200);
      if (await detectAntiBot(page)) {
        throw new Error('OLX_ANTIBOT_PERSIST');
      }
    }

    // Ждём появления контента (любой из селекторов)
    try {
      await page.waitForSelector('[data-cy="l-card"], a[href*="/oferta/"], [data-testid*="listing"]', { timeout: 15000 });
    } catch (_) {
      console.warn('[Puppeteer OLX] No card selector appeared; will continue with fallback extract');
    }

    // Прокручиваем страницу чтобы загрузить lazy-loading изображения
    await ensureScrollFullyLoaded(page);
    
    // Логируем что видим на странице
    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        linksCount: document.querySelectorAll('a').length,
        hasCards: document.querySelectorAll('[data-cy="l-card"]').length,
      };
    });
    console.log('[Puppeteer OLX] Page info:', JSON.stringify(pageInfo));
    
    // Скриншоты/HTML только в DEBUG режиме
    if (DEBUG) {
      const screenshotPath = `./debug-olx-page${pageNumber}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`[Puppeteer OLX] Screenshot saved: ${screenshotPath}`);

      const htmlPath = `./debug-olx-page${pageNumber}.html`;
      const htmlContent = await page.content();
      await fs.writeFile(htmlPath, htmlContent, 'utf8');
      console.log(`[Puppeteer OLX] HTML snapshot saved: ${htmlPath}`);
    }
    
    // Извлекаем данные - УНИВЕРСАЛЬНЫЙ МЕТОД
    const listings = await page.evaluate(() => {
      const results = [];
      
      // Ищем все ссылки на объявления (УЛУЧШЕННЫЕ СЕЛЕКТОРЫ)
      let links = [];
      
      // Вариант 1: Прямые ссылки
      links = Array.from(document.querySelectorAll('a[href*="/d/oferty/"], a[href*="/oferta/"]'));
      
      if (links.length === 0) {
        // Вариант 2: Карточки объявлений
        links = Array.from(document.querySelectorAll('[data-cy="l-card"] a, [data-testid*="listing"] a'));
      }
      
      if (links.length === 0) {
        // Вариант 3: Любые ссылки с /d/
        links = Array.from(document.querySelectorAll('a[href*="/d/"]'));
      }
      
      // Убираем дубликаты
      links = [...new Set(links)];
      
      // Группируем по уникальным URL
      const uniqueUrls = new Set();
      let skippedNoID = 0;
      let skippedNoPhoto = 0;
      let skippedInvalidURL = 0;
      
      links.forEach((link) => {
        try {
          let href = link.getAttribute('href');
          if (!href || uniqueUrls.has(href)) return;
          
          const isValidListing = /\/(d\/)?oferta\//.test(href);
          
          if (!isValidListing) {
            skippedNoID++;
            return; // Пропускаем не объявления
          }
          
          if (href.includes('/wyroznienie/') || href.endsWith('/d/oferty/') || href.endsWith('/oferty/')) {
            skippedNoID++;
            return;
          }
          
          const card = link.closest('[data-cy="l-card"]') || 
                       link.closest('div[data-testid*="listing"]') ||
                       link.parentElement?.parentElement;
          
          if (!card) return;
          
          let title = link.querySelector('h6')?.textContent?.trim() ||
                     link.querySelector('h4')?.textContent?.trim() ||
                     link.textContent?.trim();
          title = title?.split('\n')[0]?.trim();
          if (!title || title.length < 3) return;
          
          let price = 0;
          const priceEl = card.querySelector('[data-testid="ad-price"]') ||
                         card.querySelector('p:has(span)') ||
                         Array.from(card.querySelectorAll('p')).find(p => p.textContent.includes('zł'));
          if (priceEl) {
            const priceText = priceEl.textContent;
            const priceMatch = priceText.match(/(\d[\d\s,\.]*)/);
            if (priceMatch) {
              price = parseInt(priceMatch[1].replace(/[\s\.,]/g, ''), 10);
            }
          }
          
          let location = 'Polska';
          const locationEl = card.querySelector('[data-testid="location-date"]') ||
                            Array.from(card.querySelectorAll('p')).find(p => 
                              p.textContent.includes('dzisiaj') || 
                              p.textContent.includes('wczoraj') ||
                              /\d{1,2}\s\w+/.test(p.textContent)
                            );
          if (locationEl) {
            const locText = locationEl.textContent;
            const parts = locText.split('-');
            if (parts[0]) {
              location = parts[0].trim();
            }
          }
          
          let image = '';
          const imgEl = card.querySelector('img');
          if (imgEl) {
            image = imgEl.src || 
                    imgEl.dataset.src || 
                    imgEl.dataset.lazy || 
                    imgEl.dataset.original ||
                    imgEl.dataset.lazyload ||
                    imgEl.getAttribute('data-src') ||
                    imgEl.getAttribute('data-lazy') ||
                    imgEl.getAttribute('data-original') ||
                    imgEl.getAttribute('data-srcset') ||
                    '';
            if (image.startsWith('data:image') || image.length < 10) {
              image = imgEl.dataset.src || 
                      imgEl.dataset.lazy || 
                      imgEl.dataset.original ||
                      imgEl.getAttribute('data-src') ||
                      '';
            }
            if (image && image.includes('_') && !image.includes('unsplash')) {
              image = image.replace(/_\d+x\d+/g, '');
              image = image.replace(/__/g, '_');
              image = image.replace(/_\./g, '.');
            }
            const srcset = imgEl.getAttribute('srcset') || imgEl.dataset.srcset;
            if (srcset && srcset.length > 10) {
              const sources = srcset.split(',').map(s => s.trim());
              if (sources.length > 0) {
                const largestSrc = sources[sources.length - 1].split(' ')[0];
                if (largestSrc && largestSrc.startsWith('http')) {
                  image = largestSrc;
                }
              }
            }
          }
          
          if (!image || image.length < 10) {
            const imgContainer = card.querySelector('[style*="background-image"]');
            if (imgContainer) {
              const style = imgContainer.getAttribute('style');
              const urlMatch = style.match(/url\(['"]?([^'"\)]+)['"]?\)/);
              if (urlMatch && urlMatch[1]) {
                image = urlMatch[1];
              }
            }
          }
          
          if (!image || image.length < 10) {
            const pictureEl = card.querySelector('picture source');
            if (pictureEl) {
              image = pictureEl.getAttribute('srcset') || pictureEl.dataset.src || '';
              if (image.includes(',')) {
                const sources = image.split(',');
                image = sources[sources.length - 1].trim().split(' ')[0];
              }
            }
          }
          
          if (!image || image.length < 10 || image.includes('default') || image.includes('placeholder')) {
            image = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
            skippedNoPhoto++;
          }
          
          let fullUrl = href;
          if (!href.startsWith('http')) {
            fullUrl = `https://www.olx.pl${href}`;
          }
          if (!fullUrl.includes('/d/oferty/') && !fullUrl.includes('/oferta/')) {
            skippedInvalidURL++;
            return; // Skip invalid URLs
          }
          
          const idMatch = href.match(/ID([a-zA-Z0-9]+)/);
          const id = idMatch ? idMatch[1] : `olx-${Date.now()}-${results.length}`;
          
          uniqueUrls.add(href);
          const resolvedImage = image && image.startsWith('http') ? image : (image ? `https:${image}` : '');
          const gallery = resolvedImage ? [resolvedImage] : [];

          results.push({
            id,
            title,
            price,
            currency: 'zł',
            condition: 'used',
            location,
            url: fullUrl,
            image: resolvedImage,
            images: gallery,
            description: title,
            marketplace: 'olx',
            publishedAt: new Date().toISOString(),
            scrapedAt: new Date().toISOString(),
            sellerName: '',
            sellerProfileUrl: '',
            sellerType: '',
            sellerPhone: '',
            sellerAvatar: '',
            deliveryOptions: [],
            deliveryAvailable: false,
            attributes: [],
            categoryPath: [],
          });
        } catch (err) {
          console.error('Parse error:', err.message);
        }
      });
      
      return { results, skippedNoID, skippedNoPhoto, skippedInvalidURL };
    });
    
    console.log(`[Puppeteer OLX] Extracted ${listings.results.length} listings from page`);
    console.log(`[Puppeteer OLX] Photo stats: ${listings.skippedNoPhoto} used placeholder, ${listings.results.length - listings.skippedNoPhoto} had real photos`);
    console.log(`[Puppeteer OLX] Skipped: ${listings.skippedNoID} (no ID), ${listings.skippedInvalidURL} (invalid URL)`);
    
    let listingsArray = listings.results;
    
    if (listingsArray.length > 0) {
      console.log(`[Puppeteer OLX] Sample URLs:`);
      listingsArray.slice(0, 3).forEach((item, idx) => {
        console.log(`  [${idx + 1}] ${item.title.substring(0, 30)}... -> ${item.url}`);
      });
    }
    
    if (listingsArray.length === 0 && DEBUG) {
      const html = await page.content();
      const htmlPath = `./debug-olx-page${pageNumber}.html`;
      const fs = await import('fs');
      fs.writeFileSync(htmlPath, html);
      console.log(`[Puppeteer OLX] ⚠️ No listings found! HTML saved to: ${htmlPath}`);
      console.log(`[Puppeteer OLX] Page title: ${await page.title()}`);
      if (await detectAntiBot(page)) {
        throw new Error('OLX_ANTIBOT_EMPTY_PAGE');
      }
    }
    
    // 🔁 Fallback: если включена доставка и результатов нет — пробуем без фильтра доставки
    if (listingsArray.length === 0 && options?.withDelivery) {
      console.warn('[Puppeteer OLX] No results with delivery; retrying without delivery filter...');
      const altUrl = buildOLXUrl(query, pageNumber, { ...options, withDelivery: false });
      console.log(`[Puppeteer OLX] Navigating to fallback URL: ${altUrl}`);
      let fallbackAttempt = 0;
      const maxFallbackAttempts = 2;
      while (true) {
        try {
          await page.goto(altUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await randomizedPause(page, 900, 1700);
          if (await detectAntiBot(page)) {
            throw new Error('OLX_ANTIBOT_DETECTED');
          }
          break;
        } catch (err) {
          fallbackAttempt += 1;
          const isAntibot = typeof err?.message === 'string' && err.message.startsWith('OLX_ANTIBOT');
          if (isAntibot) {
            throw err;
          }
          if (fallbackAttempt > maxFallbackAttempts) {
            throw err;
          }
          await randomizedPause(page, 1500, 2500);
        }
      }

      if (await detectAntiBot(page)) {
        console.warn('[Puppeteer OLX] Anti-bot detected on fallback; waiting and reloading...');
        await sleep(4000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await randomizedPause(page, 700, 1400);
        if (await detectAntiBot(page)) {
          throw new Error('OLX_ANTIBOT_PERSIST');
        }
      }
      try {
        await page.waitForSelector('[data-cy="l-card"], a[href*="/oferta/"], [data-testid*="listing"]', { timeout: 12000 });
      } catch (_) {}
      await ensureScrollFullyLoaded(page);
      const altListings = await page.evaluate(() => {
        const results = [];
        let links = Array.from(document.querySelectorAll('a[href*="/d/oferty/"], a[href*="/oferta/"]'));
        if (links.length === 0) {
          links = Array.from(document.querySelectorAll('[data-cy="l-card"] a, [data-testid*="listing"] a'));
        }
        if (links.length === 0) {
          links = Array.from(document.querySelectorAll('a[href*="/d/"]'));
        }
        links = [...new Set(links)];
        const uniqueUrls = new Set();
        links.forEach((link) => {
          try {
            let href = link.getAttribute('href');
            if (!href || uniqueUrls.has(href)) return;
            const isValidListing = (href.includes('/d/oferty/') || href.includes('/oferta/')) && 
                                   (href.includes('ID') || href.match(/-[A-Za-z0-9]+\.html$/));
            if (!isValidListing) return;
            const card = link.closest('[data-cy="l-card"]') || link.closest('div[data-testid*="listing"]') || link.parentElement?.parentElement;
            if (!card) return;
            let title = link.querySelector('h6')?.textContent?.trim() || link.querySelector('h4')?.textContent?.trim() || link.textContent?.trim();
            title = title?.split('\n')[0]?.trim();
            if (!title || title.length < 3) return;
            let price = 0;
            const priceEl = card.querySelector('[data-testid="ad-price"]') || card.querySelector('p:has(span)') || Array.from(card.querySelectorAll('p')).find(p => p.textContent.includes('zł'));
            if (priceEl) {
              const priceText = priceEl.textContent;
              const priceMatch = priceText.match(/(\d[\d\s,\.]*)/);
              if (priceMatch) {
                price = parseInt(priceMatch[1].replace(/[\s\.,]/g, ''), 10);
              }
            }
            let location = 'Polska';
            const locationEl = card.querySelector('[data-testid="location-date"]') || Array.from(card.querySelectorAll('p')).find(p => p.textContent.includes('dzisiaj') || p.textContent.includes('wczoraj') || /\d{1,2}\s\w+/.test(p.textContent));
            if (locationEl) {
              const locText = locationEl.textContent;
              const parts = locText.split('-');
              if (parts[0]) location = parts[0].trim();
            }
            let image = '';
            const imgEl = card.querySelector('img');
            if (imgEl) {
              image = imgEl.src || imgEl.dataset.src || imgEl.dataset.lazy || imgEl.dataset.original || imgEl.dataset.lazyload || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy') || imgEl.getAttribute('data-original') || imgEl.getAttribute('data-srcset') || '';
              if (image.startsWith('data:image') || image.length < 10) {
                image = imgEl.dataset.src || imgEl.dataset.lazy || imgEl.dataset.original || imgEl.getAttribute('data-src') || '';
              }
              const srcset = imgEl.getAttribute('srcset') || imgEl.dataset.srcset;
              if (srcset && srcset.length > 10) {
                const sources = srcset.split(',').map(s => s.trim());
                if (sources.length > 0) {
                  const largestSrc = sources[sources.length - 1].split(' ')[0];
                  if (largestSrc && largestSrc.startsWith('http')) image = largestSrc;
                }
              }
            }
            if (!image || image.length < 10) {
              const imgContainer = card.querySelector('[style*="background-image"]');
              if (imgContainer) {
                const style = imgContainer.getAttribute('style');
                const urlMatch = style.match(/url\(['"]?([^'"\)]+)['"]?\)/);
                if (urlMatch && urlMatch[1]) image = urlMatch[1];
              }
            }
            if (!image || image.length < 10) {
              const pictureEl = card.querySelector('picture source');
              if (pictureEl) {
                image = pictureEl.getAttribute('srcset') || pictureEl.dataset.src || '';
                if (image.includes(',')) {
                  const sources = image.split(',');
                  image = sources[sources.length - 1].trim().split(' ')[0];
                }
              }
            }
            if (!image || image.length < 10 || image.includes('default') || image.includes('placeholder')) {
              image = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
            }
            let fullUrl = href;
            if (!href.startsWith('http')) fullUrl = `https://www.olx.pl${href}`;
            if (!fullUrl.includes('/d/oferty/') && !fullUrl.includes('/oferta/')) return;
            const idMatch = href.match(/ID([a-zA-Z0-9]+)/);
            const id = idMatch ? idMatch[1] : `olx-${Date.now()}-${results.length}`;
            uniqueUrls.add(href);
            const resolvedImage = image && image.startsWith('http') ? image : (image ? `https:${image}` : '');
            const gallery = resolvedImage ? [resolvedImage] : [];
            results.push({
              id,
              title,
              price,
              currency: 'zł',
              condition: 'used',
              location,
              url: fullUrl,
              image: resolvedImage,
              images: gallery,
              description: title,
              marketplace: 'olx',
              publishedAt: new Date().toISOString(),
              scrapedAt: new Date().toISOString(),
              sellerName: '',
              sellerProfileUrl: '',
              sellerType: '',
              sellerPhone: '',
              sellerAvatar: '',
              deliveryOptions: [],
              deliveryAvailable: false,
              attributes: [],
              categoryPath: [],
            });
          } catch (_) {}
        });
        return { results };
      });
      console.log(`[Puppeteer OLX] Fallback extracted ${altListings.results.length} listings`);
      listingsArray = altListings.results;
    }
    
    return listingsArray;
    
  } finally {
    try {
      await page.close();
    } catch (_) {}
    if (context) {
      try {
        await context.close();
      } catch (_) {}
    }
  }
}

async function enrichListingDetails(listings, options = {}) {
  if (!Array.isArray(listings) || listings.length === 0) {
    return [];
  }

  const maxDetails = Math.min(options.maxDetails ?? DEFAULT_DETAIL_LIMIT, listings.length);
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 3, 6));

  const targets = listings.filter(item => item && item.url).slice(0, maxDetails);
  if (targets.length === 0) {
    return listings;
  }

  const detailMap = new Map();

  for (let index = 0; index < targets.length; index += concurrency) {
    const batch = targets.slice(index, index + concurrency);
    const batchResults = await Promise.all(batch.map(async (listing) => {
      try {
        return await fetchListingDetails(listing);
      } catch (error) {
        console.warn('[Puppeteer OLX] Detail enrichment failed for', listing.url, error.message);
        return null;
      }
    }));

    batchResults.forEach((details, idx) => {
      if (details) {
        detailMap.set(batch[idx].url, details);
      }
    });

    if (index + concurrency < targets.length) {
      await sleep(400);
    }
  }

  return listings.map((listing) => {
    const details = detailMap.get(listing.url);
    if (!details) {
      return listing;
    }

    const mergedImages = Array.from(new Set([
      ...(listing.images || []),
      ...(details.images || []),
      listing.image,
      details.image,
    ].filter(Boolean)));

    return {
      ...listing,
      ...details,
      image: details.image || listing.image || mergedImages[0] || null,
      images: mergedImages,
      description: details.description || listing.description,
      location: details.location || listing.location,
      sellerName: details.sellerName || listing.sellerName || null,
      sellerProfileUrl: details.sellerProfileUrl || listing.sellerProfileUrl || null,
      sellerType: details.sellerType || listing.sellerType || null,
      sellerPhone: details.sellerPhone || listing.sellerPhone || null,
      sellerAvatar: details.sellerAvatar || listing.sellerAvatar || null,
      deliveryOptions: details.deliveryOptions?.length ? details.deliveryOptions : (listing.deliveryOptions || []),
      deliveryAvailable: details.deliveryAvailable ?? listing.deliveryAvailable ?? Boolean((details.deliveryOptions && details.deliveryOptions.length) || (listing.deliveryOptions && listing.deliveryOptions.length)),
      attributes: details.attributes?.length ? details.attributes : (listing.attributes || []),
      categoryPath: details.categoryPath?.length ? details.categoryPath : (listing.categoryPath || []),
      publishedAt: details.publishedAt || listing.publishedAt,
      currency: details.currency || listing.currency || 'zł',
      price: Number.isFinite(details.price) ? details.price : listing.price,
    };
  });
}

async function fetchListingDetails(listing) {
  const headers = {
    'User-Agent': pickUA(),
    'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Referer: 'https://www.olx.pl/',
    'Upgrade-Insecure-Requests': '1',
  };

  const response = await axios.get(listing.url, {
    headers,
    timeout: 20000,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  return parseListingDetails(response.data, listing);
}

function parseListingDetails(html, listing) {
  const $ = cheerio.load(html);

  let description = extractFirstText($, [
    '[data-testid="ad-description"]',
    '[data-cy="ad_description"]',
    '[data-testid="advert-description"]',
    '.offer-description__description',
    '.descriptioncontent',
  ]);

  if (description && listing.title && description.trim() === listing.title.trim()) {
    description = '';
  }

  let location = extractFirstText($, [
    '[data-testid="map-card"] p',
    '[data-testid="location"]',
    '[data-testid="location-card"] span',
    '.offer-location a',
    '.offer-location span',
  ]);

  let sellerName = extractFirstText($, [
    '[data-testid="seller-name"]',
    '[data-testid="seller-card"] h4',
    '[data-testid="user-profile-card"] h4',
    '.offer-user__name h4',
    '.seller-card .css-1fp0xv7',
  ]);

  let sellerProfileUrl = extractAttr($, [
    '[data-testid="seller-card"] a[href*="/uzytkownik/"]',
    '[data-testid="user-profile-card"] a[href*="/uzytkownik/"]',
    '.seller-card a[href*="/uzytkownik/"]',
  ], 'href');

  let sellerAvatar = extractAttr($, [
    '[data-testid="seller-card"] img',
    '.offer-user__avatar img',
  ], 'src');

  let sellerPhone = extractAttr($, [
    'a[href^="tel:"]',
    '[data-testid="contact-phone"] a',
  ], 'href');

  if (sellerPhone && sellerPhone.startsWith('tel:')) {
    sellerPhone = sellerPhone.replace('tel:', '').trim();
  }

  let sellerType = detectSellerType($);
  const { price, currency, publishedAt } = extractPriceAndDate($);

  let deliveryOptions = extractDeliveryOptions($);
  let attributes = extractAttributes($);
  let categoryPath = extractBreadcrumbs($);
  let images = extractImages($);

  const structured = parseStructuredData($);

  if (structured.description && !description) {
    description = structured.description;
  }
  if (structured.location && !location) {
    location = structured.location;
  }
  if (structured.images && structured.images.length) {
    images = Array.from(new Set([...images, ...structured.images]));
  }
  if (structured.categoryPath && structured.categoryPath.length && categoryPath.length === 0) {
    categoryPath = structured.categoryPath;
  }
  if (structured.deliveryOptions && structured.deliveryOptions.length && deliveryOptions.length === 0) {
    deliveryOptions = structured.deliveryOptions;
  }
  if (structured.telephone && !sellerPhone) {
    sellerPhone = structured.telephone;
  }
  if (structured.seller) {
    if (!sellerName && structured.seller.name) {
      sellerName = cleanText(structured.seller.name);
    }
    if (!sellerProfileUrl && structured.seller.url) {
      sellerProfileUrl = structured.seller.url;
    }
    if (!sellerPhone && structured.seller.telephone) {
      sellerPhone = cleanText(structured.seller.telephone);
    }
    if (!sellerType && (structured.seller['@type'] || structured.seller.type)) {
      sellerType = cleanText(structured.seller['@type'] || structured.seller.type);
    }
  }

  const primaryImage = images[0] || structured.images?.[0] || listing.image || null;

  if (sellerProfileUrl && !sellerProfileUrl.startsWith('http')) {
    sellerProfileUrl = `https://www.olx.pl${sellerProfileUrl}`;
  }
  if (sellerAvatar && !sellerAvatar.startsWith('http')) {
    sellerAvatar = `https:${sellerAvatar}`;
  }

  const normalizedSellerType = normalizeSellerType(sellerType || structured.sellerType);
  const normalizedDelivery = Array.from(new Set((deliveryOptions || []).map(cleanText).filter(Boolean)));
  const normalizedAttributes = attributes;

  return {
    description: description || listing.description,
    location: location || listing.location,
    price: structured.price ? parsePrice(structured.price) ?? price : price,
    currency: structured.currency || currency || listing.currency || 'zł',
    publishedAt: structured.publishedAt ? toIsoDate(structured.publishedAt) : publishedAt,
    images,
    image: primaryImage,
    sellerName: sellerName || null,
    sellerProfileUrl: sellerProfileUrl || null,
    sellerType: normalizedSellerType,
    sellerPhone: sellerPhone || null,
    sellerAvatar: sellerAvatar || null,
    deliveryOptions: normalizedDelivery,
    deliveryAvailable: normalizedDelivery.length > 0 || Boolean(structured.deliveryAvailable),
    attributes: normalizedAttributes,
    categoryPath,
  };
}

function extractFirstText($, selectors) {
  for (const selector of selectors) {
    const text = cleanText($(selector).first().text());
    if (text) {
      return text;
    }
  }
  return '';
}

function extractAttr($, selectors, attr) {
  for (const selector of selectors) {
    const value = $(selector).first().attr(attr);
    if (value) {
      return value;
    }
  }
  return '';
}

function extractDeliveryOptions($) {
  const map = new Map();
  const selectors = [
    '[data-testid="delivery-methods"] li',
    '[data-testid="delivery-methods"] div',
    '.offer-actions__shipping li',
  ];

  selectors.forEach((selector) => {
    $(selector).each((_, element) => {
      const text = cleanText($(element).text());
      if (text && !map.has(text)) {
        map.set(text, text);
      }
    });
  });

  return Array.from(map.values());
}

function extractAttributes($) {
  const map = new Map();
  const selectors = [
    '[data-testid="parameters-list"] li',
    '[data-testid="parameters-list"] div',
    '.offer-params__item',
  ];

  selectors.forEach((selector) => {
    $(selector).each((_, element) => {
      const label = cleanText($(element).find('p, span, dt').first().text());
      let value = cleanText($(element).find('p, span, dd').last().text());
      if (!value) {
        value = cleanText($(element).find('a').text());
      }
      if (label && value && !map.has(label)) {
        map.set(label, value);
      }
    });
  });

  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}

function extractBreadcrumbs($) {
  const values = new Set();
  const selectors = [
    'nav[aria-label="breadcrumb"] li',
    'ol[data-testid="breadcrumbs"] li',
    '.breadcrumbs li',
  ];

  selectors.forEach((selector) => {
    $(selector).each((_, element) => {
      const text = cleanText($(element).text());
      if (text) {
        values.add(text);
      }
    });
  });

  return Array.from(values);
}

function detectSellerType($) {
  const selectors = [
    '[data-testid="parameters-list"] li',
    '.offer-params__item',
  ];

  for (const selector of selectors) {
    let sellerType = '';
    $(selector).each((_, element) => {
      const label = cleanText($(element).find('p, span, dt').first().text());
      const value = cleanText($(element).find('p, span, dd').last().text());
      if (/oferta od/i.test(label) && value) {
        sellerType = value;
      }
    });
    if (sellerType) {
      return sellerType;
    }
  }

  const sellerBadge = cleanText($('[data-testid="seller-card"] span').text());
  if (sellerBadge) {
    return sellerBadge;
  }

  return '';
}

function extractPriceAndDate($) {
  const priceText = cleanText($('[data-testid="ad-price"]').text());
  let price = null;
  let currency = null;

  if (priceText) {
    const match = priceText.match(/(\d[\d\s,\.]*)/);
    if (match) {
      const numeric = match[1].replace(/[^\d]/g, '');
      if (numeric) {
        price = parseInt(numeric, 10);
      }
    }
    const currencyMatch = priceText.match(/(zł|pln|eur|€|usd|£)/i);
    if (currencyMatch) {
      currency = currencyMatch[1].toUpperCase().replace('€', 'EUR').replace('£', 'GBP');
    }
  }

  let publishedAt = null;
  const timeElement = $('[data-testid="sales-info"] time').attr('datetime');
  if (timeElement) {
    publishedAt = toIsoDate(timeElement);
  }

  return { price, currency, publishedAt };
}

function extractImages($) {
  const sources = new Set();
  const selectors = [
    '[data-testid="media-gallery"] img',
    '[data-testid="image-gallery"] img',
    'picture source',
    'meta[property="og:image"]',
  ];

  selectors.forEach((selector) => {
    $(selector).each((_, element) => {
      const el = $(element);
      let src = el.attr('data-src') || el.attr('src') || el.attr('content') || el.attr('data-original');
      if (!src) {
        const srcset = el.attr('srcset') || '';
        if (srcset) {
          srcset.split(',').forEach((entry) => {
            const value = entry.trim().split(' ')[0];
            if (value) {
              sources.add(normalizeImageUrl(value));
            }
          });
        }
      } else {
        sources.add(normalizeImageUrl(src));
      }
    });
  });

  return Array.from(sources).filter(Boolean);
}

function parseStructuredData($) {
  const aggregated = {
    images: [],
    deliveryOptions: [],
    categoryPath: [],
  };

  const visited = new WeakSet();

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).contents().text();
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw.trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item) => collectStructuredItem(item, aggregated, visited));
    } catch (error) {
      // Ignore malformed JSON
    }
  });

  aggregated.images = Array.from(new Set(aggregated.images.filter(Boolean).map(normalizeImageUrl)));
  aggregated.deliveryOptions = Array.from(new Set(aggregated.deliveryOptions.filter(Boolean)));
  aggregated.categoryPath = Array.from(new Set(aggregated.categoryPath.filter(Boolean)));
  aggregated.deliveryAvailable = aggregated.deliveryOptions.length > 0;

  return aggregated;
}

function collectStructuredItem(item, aggregated, visited) {
  if (!item || typeof item !== 'object') {
    return;
  }
  if (visited.has(item)) {
    return;
  }
  visited.add(item);

  if (item.description && !aggregated.description) {
    aggregated.description = cleanText(item.description);
  }
  if (item.image) {
    const images = Array.isArray(item.image) ? item.image : [item.image];
    images.filter(Boolean).forEach((img) => aggregated.images.push(img));
  }
  if (item.price && !aggregated.price) {
    aggregated.price = item.price;
  }
  if (item.priceCurrency && !aggregated.currency) {
    aggregated.currency = item.priceCurrency;
  }
  if (item.datePosted && !aggregated.publishedAt) {
    aggregated.publishedAt = item.datePosted;
  }
  if (item.telephone && !aggregated.telephone) {
    aggregated.telephone = cleanText(item.telephone);
  }
  if (item.address && !aggregated.location) {
    aggregated.location = formatAddress(item.address);
  }
  if (item.areaServed && !aggregated.location) {
    aggregated.location = cleanText(item.areaServed);
  }
  if (item.seller && !aggregated.seller) {
    aggregated.seller = item.seller;
  }
  if (item.category && !aggregated.categoryPath.length) {
    const category = Array.isArray(item.category) ? item.category : [item.category];
    aggregated.categoryPath = category.map(cleanText).filter(Boolean);
  }
  if (item.breadcrumb) {
    const breadcrumb = parseBreadcrumb(item.breadcrumb);
    if (breadcrumb.length) {
      aggregated.categoryPath = breadcrumb;
    }
  }
  if (item.itemListElement) {
    const breadcrumb = parseBreadcrumb(item.itemListElement);
    if (breadcrumb.length) {
      aggregated.categoryPath = breadcrumb;
    }
  }
  if (item.deliveryMethod) {
    const methods = Array.isArray(item.deliveryMethod) ? item.deliveryMethod : [item.deliveryMethod];
    methods.forEach((method) => {
      if (typeof method === 'string') {
        aggregated.deliveryOptions.push(cleanText(method));
      } else if (method && method.name) {
        aggregated.deliveryOptions.push(cleanText(method.name));
      }
    });
  }
  if (item.shippingDetails && item.shippingDetails.deliveryMethod) {
    const methods = Array.isArray(item.shippingDetails.deliveryMethod)
      ? item.shippingDetails.deliveryMethod
      : [item.shippingDetails.deliveryMethod];
    methods.forEach((method) => {
      if (typeof method === 'string') {
        aggregated.deliveryOptions.push(cleanText(method));
      } else if (method && method.name) {
        aggregated.deliveryOptions.push(cleanText(method.name));
      }
    });
  }
  if (item.sellerType && !aggregated.sellerType) {
    aggregated.sellerType = cleanText(item.sellerType);
  }

  Object.values(item).forEach((value) => {
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        value.forEach((entry) => collectStructuredItem(entry, aggregated, visited));
      } else {
        collectStructuredItem(value, aggregated, visited);
      }
    }
  });
}

function formatAddress(address) {
  if (!address) {
    return '';
  }
  if (typeof address === 'string') {
    return cleanText(address);
  }
  const parts = [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
    address.addressCountry,
  ].filter(Boolean).map(cleanText);
  return parts.join(', ');
}

function parseBreadcrumb(breadcrumb) {
  if (!breadcrumb) {
    return [];
  }
  if (typeof breadcrumb === 'string') {
    return breadcrumb.split('>').map(cleanText).filter(Boolean);
  }
  if (Array.isArray(breadcrumb)) {
    return breadcrumb
      .map((item) => {
        if (typeof item === 'string') return cleanText(item);
        if (item && typeof item === 'object') return cleanText(item.name || item.title || item.item?.name);
        return '';
      })
      .filter(Boolean);
  }
  if (breadcrumb.itemListElement) {
    return parseBreadcrumb(breadcrumb.itemListElement);
  }
  return [];
}

function normalizeImageUrl(url) {
  if (!url) {
    return '';
  }
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
}

function normalizeSellerType(value) {
  if (!value) {
    return null;
  }
  const normalized = value.toString().toLowerCase();
  if (normalized.includes('firm') || normalized.includes('company') || normalized.includes('business') || normalized.includes('organiz')) {
    return 'business';
  }
  if (normalized.includes('prywat') || normalized.includes('osoba') || normalized.includes('private') || normalized.includes('person')) {
    return 'private';
  }
  return normalized;
}

function parsePrice(value) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  const numeric = String(value).replace(/[^\d]/g, '');
  return numeric ? parseInt(numeric, 10) : null;
}

function toIsoDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function cleanText(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * 🔗 Построение URL для OLX
 */
function buildOLXUrl(query, page, options = {}) {
  const {
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
  } = options;
  
  const sanitizeCategoryPath = (value) => {
    const trimmed = value.replace(/^\/+|\/+$/g, '');
    if (!trimmed) {
      return null;
    }
    const segments = trimmed.split('/').map((segment) => encodeURIComponent(segment));
    return segments.join('/');
  };

  let appliedCategoryByPath = false;
  let basePath = 'd/oferty';
  if (category && category !== 'all') {
    if (category.includes('/')) {
      const sanitized = sanitizeCategoryPath(category);
      if (sanitized) {
        basePath = `d/${sanitized}`;
        appliedCategoryByPath = true;
      }
    }
  }

  // 🌍 Базовый URL
  let url = `https://www.olx.pl/${basePath}`;
  
  // Добавляем поисковый запрос (включаем локацию как ключевое слово для повышенной релевантности)
  const q = (location && location !== 'all') ? `${query || 'elektronika'} ${location}` : (query || 'elektronika');
  url += `/q-${encodeURIComponent(q)}`;
  
  const params = new URLSearchParams();
  
  if (page > 1) {
    params.append('page', page);
  }
  if (minPrice) {
    params.append('search[filter_float_price:from]', String(minPrice));
  }
  if (maxPrice) {
    params.append('search[filter_float_price:to]', String(maxPrice));
  }
  
  // 🚚 Доставка: используем самый мягкий флаг доступности доставки
  if (withDelivery) {
    params.append('search[delivery][available]', 'true');
  }

  if (category && category !== 'all' && !appliedCategoryByPath) {
    params.append('search[category_id]', String(category));
  }

  if (condition && condition !== 'all') {
    const key = condition.toString().toLowerCase();
    const mapped = CONDITION_PARAM_MAP[key] || key;
    params.append('search[filter_enum_condition][0]', mapped);
  }

  if (sellerType && sellerType !== 'all') {
    const key = sellerType.toString().toLowerCase();
    const mapped = SELLER_TYPE_PARAM_MAP[key] || key;
    params.append('search[filter_enum_offer_type][0]', mapped);
  }

  const deliveryList = Array.isArray(deliveryOptions) && deliveryOptions.length
    ? deliveryOptions
    : (delivery && delivery !== 'all' ? [delivery] : []);

  deliveryList
    .map((entry) => {
      const key = entry.toString().toLowerCase();
      return DELIVERY_PARAM_MAP[key] || key;
    })
    .filter(Boolean)
    .forEach((value, index) => {
      params.append(`search[filter_enum_delivery_methods][${index}]`, value);
    });

  if (sortBy) {
    const key = sortBy.toString().toLowerCase();
    const mapped = SORT_PARAM_MAP[key] || sortBy;
    params.append('search[sort]', mapped);
  }

  // Поиск по описанию тоже включаем для лучшей вибрации по ключевым словам
  params.append('search[description]', '1');
  
  const paramString = params.toString();
  if (paramString) {
    url += `?${paramString}`;
  }
  
  console.log(`[OLX URL] Built URL: ${url}`);
  return url;
}

async function prepareSession(page) {
  const warmupUrl = 'https://www.olx.pl/';
  try {
    await withRetries(async () => {
      await page.goto(warmupUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
      await randomizedPause(page, 800, 1500);
      if (await detectAntiBot(page)) {
        throw new Error('OLX_ANTIBOT_WARMUP');
      }
    }, { retries: 1, delayMs: 1200 });

    // Пробуем принять куки, чтобы получить полноценную сессию
    await clickFirstMatch(page, [
      '[data-testid="cookie-consent-accept"] button',
      'button[data-testid="accept-cookies-button"]',
      '#onetrust-accept-btn-handler',
      'button:has-text("Akceptuj")',
      'button:has-text("Zgadzam")',
    ]);

    await randomizedPause(page, 500, 900);
    await page.evaluate(() => {
      window.scrollBy(0, 250);
    }).catch(() => {});
    await randomizedPause(page, 400, 800);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    }).catch(() => {});
  } catch (error) {
    console.warn(`[Puppeteer OLX] Session warmup skipped: ${error.message}`);
  }
}

async function clickFirstMatch(page, selectors) {
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click({ delay: randomBetween(30, 120) });
        return true;
      }
    } catch (_) {
      // ignore individual selector failures
    }
  }
  return false;
}

async function randomizedPause(page, min = 500, max = 1200) {
  const duration = randomBetween(min, max);
  if (typeof page.waitForTimeout === 'function') {
    await page.waitForTimeout(duration);
  } else {
    await sleep(duration);
  }
}

function randomBetween(min, max) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

/**
 * Ждём полной загрузки ленивых изображений и контента
 */
async function ensureScrollFullyLoaded(page) {
  // Несколько итераций прокрутки до стабилизации высоты страницы
  let lastHeight = await page.evaluate('document.body.scrollHeight');
  let stableIterations = 0;
  while (stableIterations < 3) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await sleep(700);
    const newHeight = await page.evaluate('document.body.scrollHeight');
    if (newHeight === lastHeight) {
      stableIterations += 1;
    } else {
      stableIterations = 0;
      lastHeight = newHeight;
    }
  }
  // Возвращаемся наверх
  await page.evaluate('window.scrollTo(0, 0)');
}

/**
 * Антибот-детекция (простые эвристики)
 */
async function detectAntiBot(page) {
  const html = await page.content();
  if (/captcha|are you human|cf-challenge|access denied/i.test(html)) {
    return true;
  }
  // OLX иногда показывает pageguard / ошибки на польском
  const title = await page.title();
  if (/attention required|verify|ups, mamy problem|ups mamy problem|przepraszamy|zbyt wiele zapytań|403|niedostępna/i.test(title) ||
      /ups, mamy problem|ups mamy problem|przepraszamy|zbyt wiele zapytań|używasz automatycznych/i.test(html)) {
    return true;
  }
  return false;
}

/**
 * Универсальный ретрай с задержкой
 */
async function withRetries(fn, { retries = 2, delayMs = 1000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(delayMs * Math.pow(2, attempt));
      }
    }
  }
  throw lastErr;
}

/**
 * ⏱️ Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 🛑 Закрыть браузер
 */
export async function closeBrowser() {
  if (browser) {
    console.log('[Puppeteer] Closing browser...');
    await browser.close();
    browser = null;
    browserLaunchPromise = null;
  }
}

export default { scrapeOLXWithPuppeteer, closeBrowser };
