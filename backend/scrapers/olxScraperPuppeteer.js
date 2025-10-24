import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

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
  const { maxPages = 3 } = options;
  
  console.log(`[Puppeteer OLX] Starting scrape for: "${query}"`);
  console.log(`[Puppeteer OLX] Will parse up to ${maxPages} pages`);
  
  const allResults = [];
  
  try {
    const browserInstance = await getBrowser();
    
    // Парсим несколько страниц с ретраями
    for (let page = 1; page <= maxPages; page++) {
      try {
        const pageResults = await withRetries(
          () => scrapePage(browserInstance, query, page, options),
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
    
    console.log(`[Puppeteer OLX] ✅ COMPLETE: ${allResults.length} total listings found`);
    return allResults;
    
  } catch (error) {
    console.error('[Puppeteer OLX] Scraping failed:', error);
    throw error;
  }
}

/**
 * 📄 Парсинг одной страницы
 */
async function scrapePage(browserInstance, query, pageNumber, options) {
  const page = await browserInstance.newPage();
  
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
    
    // Строим URL
    const url = buildOLXUrl(query, pageNumber, options);
    console.log(`[Puppeteer OLX] Navigating to: ${url}`);
    
    // Переходим на страницу (с ретраем)
    await withRetries(async () => {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
    }, { retries: 2, delayMs: 1500 });
    
    // Проверка антибот/капча
    if (await detectAntiBot(page)) {
      console.warn('[Puppeteer OLX] Anti-bot detected; waiting and retrying once...');
      await sleep(3500);
      await page.reload({ waitUntil: 'domcontentloaded' });
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
          
          const isValidListing = (href.includes('/d/oferty/') || href.includes('/oferta/')) && 
                                 (href.includes('ID') || href.match(/-[A-Za-z0-9]+\.html$/));
          
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
          
          results.push({
            id,
            title,
            price,
            currency: 'zł',
            condition: 'used',
            location,
            url: fullUrl,
            image: image.startsWith('http') ? image : (image ? `https:${image}` : ''),
            description: title,
            marketplace: 'olx',
            publishedAt: new Date().toISOString(),
            scrapedAt: new Date().toISOString(),
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
    }
    
    // 🔁 Fallback: если включена доставка и результатов нет — пробуем без фильтра доставки
    if (listingsArray.length === 0 && options?.withDelivery) {
      console.warn('[Puppeteer OLX] No results with delivery; retrying without delivery filter...');
      const altUrl = buildOLXUrl(query, pageNumber, { ...options, withDelivery: false });
      console.log(`[Puppeteer OLX] Navigating to fallback URL: ${altUrl}`);
      await withRetries(async () => {
        await page.goto(altUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      }, { retries: 1, delayMs: 1000 });
     // Повторная проверка антибота на fallback-странице
     if (await detectAntiBot(page)) {
       console.warn('[Puppeteer OLX] Anti-bot detected on fallback; waiting and reloading...');
       await sleep(3500);
       await page.reload({ waitUntil: 'domcontentloaded' });
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
            results.push({ id, title, price, currency: 'zł', condition: 'used', location, url: fullUrl, image: image.startsWith('http') ? image : (image ? `https:${image}` : ''), description: title, marketplace: 'olx', publishedAt: new Date().toISOString(), scrapedAt: new Date().toISOString() });
          } catch (_) {}
        });
        return { results };
      });
      console.log(`[Puppeteer OLX] Fallback extracted ${altListings.results.length} listings`);
      listingsArray = altListings.results;
    }
    
    return listingsArray;
    
  } finally {
    await page.close();
  }
}

/**
 * 🔗 Построение URL для OLX
 */
function buildOLXUrl(query, page, options) {
  const { minPrice, maxPrice, withDelivery, location } = options;
  
  // 🌍 Базовый URL
  let url = 'https://www.olx.pl/d/oferty';
  
  // Добавляем поисковый запрос (включаем локацию как ключевое слово для повышенной релевантности)
  const q = (location && location !== 'all') ? `${query || 'elektronika'} ${location}` : (query || 'elektronika');
  url += `/q-${encodeURIComponent(q)}`;
  
  const params = new URLSearchParams();
  
  if (page > 1) {
    params.append('page', page);
  }
  if (minPrice) {
    params.append('search[filter_float_price:from]', minPrice);
  }
  if (maxPrice) {
    params.append('search[filter_float_price:to]', maxPrice);
  }
  
  // 🚚 Доставка: используем самый мягкий флаг доступности доставки
  if (withDelivery) {
    params.append('search[delivery][available]', 'true');
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
