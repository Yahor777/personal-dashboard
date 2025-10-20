import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scraper for OLX.pl
 * Парсит ВСЕ страницы поиска на OLX (до 5 страниц = ~200 объявлений)
 */
export async function scrapeOLX(query, options = {}) {
  const { minPrice, maxPrice, category, location, maxPages = 5 } = options;
  
  console.log(`[OLX] Starting FULL scrape for: "${query}"`);
  console.log(`[OLX] Will parse up to ${maxPages} pages (~${maxPages * 40} listings)`);
  
  const allResults = [];
  
  // Парсим несколько страниц
  for (let page = 1; page <= maxPages; page++) {
    try {
      // Build OLX URL с пагинацией
      let url = `https://www.olx.pl/d/oferty/q-${encodeURIComponent(query || 'elektronika')}`;
      
      // Add filters
      const params = new URLSearchParams();
      if (minPrice) params.append('search[filter_float_price:from]', minPrice);
      if (maxPrice) params.append('search[filter_float_price:to]', maxPrice);
      
      // Пагинация
      if (page > 1) {
        params.append('page', page);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log(`[OLX] Fetching page ${page}/${maxPages}: ${url}`);
      
      const pageResults = await scrapeSinglePage(url, page);
      allResults.push(...pageResults);
      
      console.log(`[OLX] Page ${page}: found ${pageResults.length} listings (total: ${allResults.length})`);
      
      // Если на странице меньше 10 результатов - это последняя страница
      if (pageResults.length < 10) {
        console.log(`[OLX] Last page reached (got only ${pageResults.length} results)`);
        break;
      }
      
      // Небольшая задержка между запросами чтобы не банили
      await sleep(1000);
      
    } catch (error) {
      console.error(`[OLX] Error on page ${page}:`, error.message);
      // Продолжаем даже если одна страница не загрузилась
      if (page === 1) {
        throw error; // Если первая страница не загрузилась - выбрасываем ошибку
      }
      break;
    }
  }
  
  console.log(`[OLX] ✅ FULL SCRAPE COMPLETE: ${allResults.length} total listings found`);
  return allResults;
}

/**
 * Парсит одну страницу OLX
 */
async function scrapeSinglePage(url, pageNumber) {

  try {
    console.log(`[OLX] Fetching: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Accept any status < 500
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Попробуем разные селекторы (OLX часто меняет структуру)
    const selectors = [
      '[data-cy="l-card"]',
      'div[data-cy="listing-grid"] > div',
      '.css-1sw7q4x',
      '[data-testid="listing-grid"] > div',
      'div.offer-wrapper'
    ];
    
    let foundCards = $();
    for (const selector of selectors) {
      const cards = $(selector);
      if (cards.length > 0) {
        console.log(`[OLX] Found ${cards.length} cards with selector: ${selector}`);
        foundCards = cards;
        break;
      }
    }
    
    if (foundCards.length === 0) {
      console.warn('[OLX] No listing cards found with any selector');
      console.log('[OLX] Page title:', $('title').text());
      console.log('[OLX] Page size:', response.data.length, 'bytes');
      
      // Возвращаем пустой массив но не выбрасываем ошибку
      return results;
    }

    // Parse listing cards
    foundCards.each((index, element) => {
      try {
        const $card = $(element);
        
        // Extract link (несколько вариантов)
        let href = $card.find('a').first().attr('href');
        if (!href) {
          href = $card.find('[data-cy="listing-ad-title"]').closest('a').attr('href');
        }
        if (!href) {
          href = $card.attr('href');
        }
        if (!href) return;

        // Extract title (несколько вариантов)
        let title = $card.find('h6').text().trim();
        if (!title) title = $card.find('h4').text().trim();
        if (!title) title = $card.find('[data-cy="ad-title"]').text().trim();
        if (!title) title = $card.find('[data-cy="listing-ad-title"]').text().trim();
        if (!title) title = $card.find('.title').text().trim();
        if (!title) return;

        // Extract price (несколько вариантов)
        let priceText = $card.find('[data-testid="ad-price"]').text().trim();
        if (!priceText) priceText = $card.find('.price').text().trim();
        if (!priceText) priceText = $card.find('[data-cy="listing-price"]').text().trim();
        const price = parsePrice(priceText);

        // Extract location
        let locationText = $card.find('[data-testid="location-date"]').text().trim();
        if (!locationText) locationText = $card.find('.location').text().trim();
        const locationParts = locationText.split('-');
        const itemLocation = locationParts[0]?.trim() || 'Polska';

        // Extract image
        const imageEl = $card.find('img').first();
        let image = imageEl.attr('src') || imageEl.attr('data-src') || imageEl.attr('data-lazy');
        
        // Если изображение placeholder - берём data-src
        if (image && image.includes('placeholder')) {
          image = imageEl.attr('data-src') || image;
        }

        // Build full URL
        const fullUrl = href.startsWith('http') ? href : `https://www.olx.pl${href}`;

        // Extract ID from URL
        const idMatch = fullUrl.match(/ID([a-zA-Z0-9]+)/);
        const id = idMatch ? idMatch[1] : `olx-${Date.now()}-${index}`;

        results.push({
          id,
          title,
          price,
          currency: 'zł',
          condition: 'good',
          location: itemLocation,
          url: fullUrl,
          image: image || 'https://via.placeholder.com/400x300?text=No+Image',
          description: `${title} - ${itemLocation}`,
          marketplace: 'olx',
          scrapedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[OLX] Failed to parse card:', err.message);
      }
    });

    console.log(`[OLX] Successfully parsed ${results.length} results`);
    return results;
  } catch (error) {
    console.error('[OLX] Scraping error:', error.message);
    throw new Error(`OLX scraping failed: ${error.message}`);
  }
}

/**
 * Parse price from text
 */
function parsePrice(priceText) {
  if (!priceText) return 0;
  
  // Remove "zł", spaces, and other non-numeric characters
  const match = priceText.match(/(\d[\d\s]*)/);
  if (!match) return 0;
  
  const cleanPrice = match[1].replace(/\s/g, '');
  return parseInt(cleanPrice, 10) || 0;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default { scrapeOLX };
