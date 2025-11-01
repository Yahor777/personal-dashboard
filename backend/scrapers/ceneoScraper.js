import axios from 'axios';
import * as cheerio from 'cheerio';
import cache from '../utils/cache.js';

const CENEO_BASE_URL = 'https://www.ceneo.pl';

const buildCacheKey = (query, options) =>
  cache.generateKey(query, { marketplace: 'ceneo', ...options });

export default async function scrapeCeneo(query, { category = '' } = {}) {
  const cacheKey = buildCacheKey(query, { category });

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    let searchUrl = `${CENEO_BASE_URL}/szukaj-${encodeURIComponent(query)}`;
    if (category) {
      searchUrl += `;szukaj-w-kategorii-${category}`;
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

    $('.cat-prod-row').each((_, element) => {
      const $element = $(element);
      const title = $element.find('.cat-prod-row-name').text().trim();
      const price = $element.find('.price').text().trim();
      const link = $element.find('.cat-prod-row-name a').attr('href');
      const image = $element.find('.cat-prod-row-foto img').attr('src');

      if (title && price) {
        listings.push({
          title,
          price,
          link: link ? (link.startsWith('http') ? link : `${CENEO_BASE_URL}${link}`) : '',
          image: image || '',
          source: 'ceneo',
        });
      }
    });

    cache.set(cacheKey, listings, 300);
    return listings;
  } catch (error) {
    throw new Error(`Ceneo scraping failed: ${error.message}`);
  }
}
