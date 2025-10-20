import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scraper for Ceneo.pl
 * Парсит страницы поиска на Ceneo (сравнение цен)
 */
export async function scrapeCeneo(query, options = {}) {
  const { minPrice, maxPrice } = options;
  
  // Build Ceneo URL
  let url = `https://www.ceneo.pl/;szukaj-${encodeURIComponent(query)}`;
  
  // Add price filters
  if (minPrice || maxPrice) {
    const params = new URLSearchParams();
    if (minPrice) params.append('price_from', minPrice);
    if (maxPrice) params.append('price_to', maxPrice);
    url += `;${params.toString().replace(/&/g, ';')}`;
  }

  try {
    console.log(`[Ceneo] Fetching: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl,en-US;q=0.7,en;q=0.3',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Parse product cards
    $('.cat-prod-row, .product-item, [data-pid]').each((index, element) => {
      try {
        const $card = $(element);
        
        // Extract title and link
        const linkEl = $card.find('.product-name a, .cat-prod-row__name a, h2 a').first();
        const title = linkEl.text().trim();
        const href = linkEl.attr('href');
        
        if (!title || !href) return;

        // Extract price
        const priceEl = $card.find('.price, .product-price, .cat-prod-row__price');
        const priceText = priceEl.text().trim();
        const price = parsePrice(priceText);

        // Extract image
        const imageEl = $card.find('img').first();
        const image = imageEl.attr('src') || imageEl.attr('data-src') || imageEl.attr('data-original');

        // Build full URL
        const fullUrl = href.startsWith('http') ? href : `https://www.ceneo.pl${href}`;

        // Extract ID
        const id = `ceneo-${Date.now()}-${index}`;

        results.push({
          id,
          title,
          price,
          currency: 'zł',
          condition: 'new', // Ceneo - в основном новые товары
          location: 'Polska (różne sklepy)',
          url: fullUrl,
          image,
          description: `Najlepsza cena w sklepach online: ${title}`,
          marketplace: 'ceneo',
          scrapedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[Ceneo] Failed to parse card:', err.message);
      }
    });

    console.log(`[Ceneo] Found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('[Ceneo] Scraping error:', error.message);
    throw new Error(`Ceneo scraping failed: ${error.message}`);
  }
}

/**
 * Parse price from text
 */
function parsePrice(priceText) {
  if (!priceText) return 0;
  
  // Remove "zł", spaces, commas
  const match = priceText.match(/(\d[\d\s,]*)/);
  if (!match) return 0;
  
  const cleanPrice = match[1].replace(/[\s,]/g, '');
  return parseInt(cleanPrice, 10) || 0;
}

export default { scrapeCeneo };
