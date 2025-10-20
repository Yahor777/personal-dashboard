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
  const { minPrice, maxPrice, category, location, maxPages = 3 } = options;
  
  console.log(`[Puppeteer OLX] Starting scrape for: "${query}"`);
  console.log(`[Puppeteer OLX] Will parse up to ${maxPages} pages`);
  
  const allResults = [];
  
  try {
    const browserInstance = await getBrowser();
    
    // Парсим несколько страниц
    for (let page = 1; page <= maxPages; page++) {
      try {
        const pageResults = await scrapePage(browserInstance, query, page, options);
        allResults.push(...pageResults);
        
        console.log(`[Puppeteer OLX] Page ${page}/${maxPages}: found ${pageResults.length} listings (total: ${allResults.length})`);
        
        // Если на странице меньше 5 результатов - это последняя страница
        if (pageResults.length < 5) {
          console.log(`[Puppeteer OLX] Last page reached`);
          break;
        }
        
        // Задержка между страницами
        if (page < maxPages) {
          await sleep(2000);
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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
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
    
    // Переходим на страницу
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    
    // Ждём загрузки контента
    console.log('[Puppeteer OLX] Waiting for content...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 секунд на загрузку
    
    // Прокручиваем страницу чтобы загрузить lazy-loading изображения
    console.log('[Puppeteer OLX] Scrolling to load images...');
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0); // Возвращаемся наверх
            resolve();
          }
        }, 100);
      });
    });
    
    // Ждём ещё немного после прокрутки
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 секунды
    
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
    
    // Делаем скриншот для отладки
    const screenshotPath = `./debug-olx-page${pageNumber}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`[Puppeteer OLX] Screenshot saved: ${screenshotPath}`);
    
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
      
      console.log(`[Page] Found ${links.length} listing links`);
      
      // Группируем по уникальным URL
      const uniqueUrls = new Set();
      let skippedNoID = 0;
      let skippedNoPhoto = 0;
      let skippedInvalidURL = 0;
      
      links.forEach((link) => {
        try {
          let href = link.getAttribute('href');
          if (!href || uniqueUrls.has(href)) return;
          
          // ВАЖНО: Берём только ссылки на объявления
          // Проверяем что это /d/oferty/ или /oferta/ И содержит уникальный идентификатор
          const isValidListing = (href.includes('/d/oferty/') || href.includes('/oferta/')) && 
                                 (href.includes('ID') || href.match(/-[A-Za-z0-9]+\.html$/));
          
          if (!isValidListing) {
            skippedNoID++;
            return; // Пропускаем не объявления
          }
          
          // Пропускаем wyróżnione без конкретного ID (общие страницы)
          if (href.includes('/wyroznienie/') || href.endsWith('/d/oferty/') || href.endsWith('/oferty/')) {
            skippedNoID++;
            return;
          }
          
          // Находим родительский контейнер объявления
          const card = link.closest('[data-cy="l-card"]') || 
                       link.closest('div[data-testid*="listing"]') ||
                       link.parentElement?.parentElement;
          
          if (!card) return;
          
          // Заголовок - берём из самой ссылки или ищем h6
          let title = link.querySelector('h6')?.textContent?.trim() ||
                     link.querySelector('h4')?.textContent?.trim() ||
                     link.textContent?.trim();
          
          // Очищаем заголовок от мусора
          title = title?.split('\n')[0]?.trim();
          
          if (!title || title.length < 3) return;
          
          // Цена - ищем в родительском контейнере
          let price = 0;
          const priceEl = card.querySelector('[data-testid="ad-price"]') ||
                         card.querySelector('p:has(span)') ||
                         Array.from(card.querySelectorAll('p')).find(p => p.textContent.includes('zł'));
          
          if (priceEl) {
            const priceText = priceEl.textContent;
            const priceMatch = priceText.match(/(\d[\d\s,.]*)/);
            if (priceMatch) {
              price = parseInt(priceMatch[1].replace(/[\s,.]/g, ''), 10);
            }
          }
          
          // Локация
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
          
          // Изображение (АГРЕССИВНЫЙ ПОИСК ФОТО)
          let image = '';
          
          // МЕТОД 1: Ищем img внутри карточки
          const imgEl = card.querySelector('img');
          if (imgEl) {
            // Пробуем ВСЕ возможные атрибуты
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
            
            // Если src это data:image (placeholder) - ищем реальный URL
            if (image.startsWith('data:image') || image.length < 10) {
              image = imgEl.dataset.src || 
                      imgEl.dataset.lazy || 
                      imgEl.dataset.original ||
                      imgEl.getAttribute('data-src') ||
                      '';
            }
            
            // Убираем ограничения размера - берём оригинал
            if (image && image.includes('_') && !image.includes('unsplash')) {
              // Убираем размеры вида _300x200
              image = image.replace(/_\d+x\d+/g, '');
              // Убираем двойное подчеркивание
              image = image.replace(/__/g, '_');
              // Убираем подчеркивание перед точкой
              image = image.replace(/_\./g, '.');
            }
            
            // МЕТОД 2: srcset с максимальным разрешением
            const srcset = imgEl.getAttribute('srcset') || imgEl.dataset.srcset;
            if (srcset && srcset.length > 10) {
              const sources = srcset.split(',').map(s => s.trim());
              if (sources.length > 0) {
                // Берём последний (самый большой)
                const largestSrc = sources[sources.length - 1].split(' ')[0];
                if (largestSrc && largestSrc.startsWith('http')) {
                  image = largestSrc;
                }
              }
            }
          }
          
          // МЕТОД 3: Ищем background-image в стилях
          if (!image || image.length < 10) {
            const imgContainer = card.querySelector('[style*="background-image"]');
            if (imgContainer) {
              const style = imgContainer.getAttribute('style');
              const urlMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
              if (urlMatch && urlMatch[1]) {
                image = urlMatch[1];
              }
            }
          }
          
          // МЕТОД 4: Ищем picture > source
          if (!image || image.length < 10) {
            const pictureEl = card.querySelector('picture source');
            if (pictureEl) {
              image = pictureEl.getAttribute('srcset') || pictureEl.dataset.src || '';
              if (image.includes(',')) {
                // Берём последний (самый большой)
                const sources = image.split(',');
                image = sources[sources.length - 1].trim().split(' ')[0];
              }
            }
          }
          
          // Если нет фото - используем placeholder (НЕ пропускаем!)
          if (!image || image.length < 10 || image.includes('default') || image.includes('placeholder')) {
            // Placeholder высокого качества
            image = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
            skippedNoPhoto++;
          }
          
          // Полный URL - исправляем формат
          let fullUrl = href;
          if (!href.startsWith('http')) {
            fullUrl = `https://www.olx.pl${href}`;
          }
          // Убеждаемся что это прямая ссылка на объявление
          if (!fullUrl.includes('/d/oferty/') && !fullUrl.includes('/oferta/')) {
            skippedInvalidURL++;
            return; // Skip invalid URLs
          }
          
          // ID из URL
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
    
    const listingsArray = listings.results;
    
    // Логируем примеры URL
    if (listingsArray.length > 0) {
      console.log(`[Puppeteer OLX] Sample URLs:`);
      listingsArray.slice(0, 3).forEach((item, idx) => {
        console.log(`  [${idx + 1}] ${item.title.substring(0, 30)}... -> ${item.url}`);
      });
    }
    
    // Если ничего не нашли - сохраняем HTML для анализа
    if (listingsArray.length === 0) {
      const html = await page.content();
      const htmlPath = `./debug-olx-page${pageNumber}.html`;
      const fs = await import('fs');
      fs.writeFileSync(htmlPath, html);
      console.log(`[Puppeteer OLX] ⚠️ No listings found! HTML saved to: ${htmlPath}`);
      console.log(`[Puppeteer OLX] Page title: ${await page.title()}`);
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
  
  // 🌍 Строим базовый URL с учетом города
  let url = 'https://www.olx.pl/d/oferty';
  
  // Добавляем город если указан
  if (location && location !== 'all') {
    const citySlug = location.toLowerCase()
      .replace(/ł/g, 'l')
      .replace(/ą/g, 'a')
      .replace(/ć/g, 'c')
      .replace(/ę/g, 'e')
      .replace(/ń/g, 'n')
      .replace(/ó/g, 'o')
      .replace(/ś/g, 's')
      .replace(/ź/g, 'z')
      .replace(/ż/g, 'z');
    url += `/${citySlug}`;
  }
  
  // Добавляем поисковый запрос
  url += `/q-${encodeURIComponent(query || 'elektronika')}`;
  
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
  
  // 🚚 Фильтр доставки OLX (несколько вариантов параметров)
  if (withDelivery) {
    // Пробуем разные параметры которые использует OLX
    params.append('search[filter_enum_delivery_methods][0]', 'courier');
    params.append('search[delivery][available]', 'true');
    params.append('search[dist]', '0');
  }
  
  const paramString = params.toString();
  if (paramString) {
    url += `?${paramString}`;
  }
  
  console.log(`[OLX URL] Built URL: ${url}`);
  console.log(`[OLX URL] withDelivery: ${withDelivery}`);
  
  return url;
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
