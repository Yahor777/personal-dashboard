import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fsPromises from 'fs/promises';

puppeteer.use(StealthPlugin());

async function inspect() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('https://www.olx.pl/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const selectors = await page.evaluate(() => ({
    search: document.querySelector('input[data-testid="search-input"]')?.outerHTML || null,
    locationInput: document.querySelector('input[name="search[city]"]')?.outerHTML ||
      document.querySelector('input[data-testid="search-location-input"]')?.outerHTML || null,
    locationButton: document.querySelector('[data-testid="search-location-open"]')?.outerHTML ||
      document.querySelector('button[data-testid="location-open"]')?.outerHTML || null,
    submitButton: document.querySelector('button[data-testid="search-submit"]')?.outerHTML || null,
  }));
  console.log(selectors);
  const html = await page.content();
  await fsPromises.writeFile('debug-olx-home.html', html, 'utf8');
  console.log('Saved HTML to debug-olx-home.html');
  await browser.close();
}

inspect().catch((err) => {
  console.error(err);
  process.exit(1);
});
