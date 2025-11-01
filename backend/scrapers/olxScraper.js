import axios from 'axios';
import * as cheerio from 'cheerio';
import cache from '../utils/cache.js';

const OLX_BASE_URL = 'https://www.olx.pl';

const buildCacheKey = (query, options) =>
  cache.generateKey(query, { marketplace: 'olx-static', ...options });

export default async function scrapeOLX(query, { city = '', category = '' } = {}) {
  const cacheKey = buildCacheKey(query, { city, category });

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    let searchUrl = `${OLX_BASE_URL}/oferty/q-${encodeURIComponent(query)}`;

    if (city) {
      searchUrl += `/?search%5Bfilter_enum_voivodeship%5D%5B0%5D=${encodeURIComponent(city)}`;
    }

    if (category) {
      searchUrl += city ? `&search%5Bcategory_id%5D=${category}` : `/?search%5Bcategory_id%5D=${category}`;
    }

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const listings = [];

    $('[data-cy="l-card"]').each((_, element) => {
      const $element = $(element);

      const title = $element.find('h6').text().trim();
      const price = $element.find('[data-testid="ad-price"]').text().trim();
      const location = $element.find('[data-testid="location-date"]').text().trim();
      const link = $element.find('a').attr('href');
      const image = $element.find('img').attr('src');

      if (title && price) {
        listings.push({
          title,
          price,
          location,
          link: link ? (link.startsWith('http') ? link : `${OLX_BASE_URL}${link}`) : '',
          image: image || '',
          source: 'olx-static',
        });
      }
    });

    cache.set(cacheKey, listings, 300);
    return listings;
  } catch (error) {
    throw new Error(`OLX scraping failed: ${error.message}`);
  }
}
