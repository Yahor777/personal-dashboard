import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scraper for x-kom.pl
 * Парсит страницы поиска на x-kom
 */
export async function scrapeXkom(query, options = {}) {
  const { minPrice, maxPrice } = options;
  
  // Build x-kom URL
  let url = `https://www.x-kom.pl/szukaj?q=${encodeURIComponent(query)}`;
  
  // Add price filters
  if (minPrice) url += `&f201-0=${minPrice}`;
  if (maxPrice) url += `&f201-1=${maxPrice}`;

  try {
    console.log(`[x-kom] Fetching: ${url}`);
    
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
    $('[data-test="product-item"], .product-item, .sc-1yu46qn-4').each((index, element) => {
      try {
        const $card = $(element);
        
        // Extract title and link
        const linkEl = $card.find('a[href*="/p/"]').first();
        const href = linkEl.attr('href');
        const title = linkEl.attr('title') || $card.find('h3, .product-name').text().trim();
        
        if (!title || !href) return;

        // Extract price
        const priceEl = $card.find('[data-test="product-price"], .price, .sc-6n68jh-0');
        const priceText = priceEl.text().trim();
        const price = parsePrice(priceText);

        // Extract image
        const imageEl = $card.find('img').first();
        const image = imageEl.attr('src') || imageEl.attr('data-src');

        // Build full URL
        const fullUrl = href.startsWith('http') ? href : `https://www.x-kom.pl${href}`;

        // Extract ID from URL
        const idMatch = fullUrl.match(/\/p\/(\d+)/);
        const id = idMatch ? `xkom-${idMatch[1]}` : `xkom-${Date.now()}-${index}`;

        results.push({
          id,
          title,
          price,
          currency: 'zł',
          condition: 'new',
          location: 'Sklep x-kom',
          url: fullUrl,
          image,
          description: `Nowy produkt w x-kom: ${title}`,
          marketplace: 'xkom',
          scrapedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[x-kom] Failed to parse card:', err.message);
      }
    });

    console.log(`[x-kom] Found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('[x-kom] Scraping error:', error.message);
    throw new Error(`x-kom scraping failed: ${error.message}`);
  }
}

/**
 * Parse price from text
 */
function parsePrice(priceText) {
  if (!priceText) return 0;
  
  const match = priceText.match(/(\d[\d\s,]*)/);
  if (!match) return 0;
  
  const cleanPrice = match[1].replace(/[\s,]/g, '');
  return parseInt(cleanPrice, 10) || 0;
}

export default { scrapeXkom };
