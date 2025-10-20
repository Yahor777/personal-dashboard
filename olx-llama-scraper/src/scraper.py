"""
OLX Scraper - Асинхронный парсинг объявлений через Playwright

Функционал:
- Поиск объявлений по запросам
- Пагинация результатов
- Сбор детальной информации с каждой страницы объявления
- Скачивание изображений
- Обнаружение CAPTCHA
- Respect robots.txt
"""

import asyncio
import random
from typing import List, Dict, Optional, Any
from datetime import datetime
from urllib.parse import urljoin, quote_plus
from playwright.async_api import async_playwright, Page, Browser, TimeoutError as PlaywrightTimeoutError
from loguru import logger

from .utils import (
    RateLimiter,
    RobotsParser,
    download_image,
    add_to_manual_review,
    clean_text,
    parse_price,
    extract_id_from_url,
    is_captcha_present,
    get_random_user_agent
)


class OLXScraper:
    """
    Асинхронный scraper для OLX.pl
    """
    
    BASE_URL = "https://www.olx.pl"
    SEARCH_URL = "https://www.olx.pl/d/oferty/q-{query}/"
    
    def __init__(self, config: Dict[str, Any], user_agents: List[str]):
        """
        Args:
            config: Словарь с настройками из utils.load_config()
            user_agents: Список User-Agent строк
        """
        self.config = config
        self.user_agents = user_agents
        
        # Rate limiter
        self.rate_limiter = RateLimiter(
            calls_per_minute=config['rate_limit'],
            min_delay=config['min_delay'],
            max_delay=config['max_delay']
        )
        
        # Robots.txt parser
        self.robots = None
        if config['respect_robots']:
            self.robots = RobotsParser(config['robots_url'])
        
        # Playwright объекты (инициализируются позже)
        self.browser: Optional[Browser] = None
        self.context = None
        
        logger.info("OLXScraper initialized")
    
    async def __aenter__(self):
        """
        Context manager entry - запускает браузер
        """
        await self._init_browser()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """
        Context manager exit - закрывает браузер
        """
        await self._close_browser()
    
    async def _init_browser(self):
        """
        Инициализирует Playwright браузер
        """
        logger.info("Launching Playwright browser...")
        
        playwright = await async_playwright().start()
        
        # Выбор браузера
        browser_type = self.config['browser_type']
        headless = self.config['headless']
        
        if browser_type == 'chromium':
            browser_launcher = playwright.chromium
        elif browser_type == 'firefox':
            browser_launcher = playwright.firefox
        else:
            browser_launcher = playwright.webkit
        
        # Запуск браузера
        self.browser = await browser_launcher.launch(
            headless=headless,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
            ]
        )
        
        # Создаём контекст с User-Agent
        user_agent = get_random_user_agent(self.user_agents)
        
        self.context = await self.browser.new_context(
            user_agent=user_agent,
            viewport={'width': 1920, 'height': 1080},
            locale='pl-PL',
            timezone_id='Europe/Warsaw',
            proxy={'server': self.config['proxy']} if self.config.get('proxy') else None
        )
        
        logger.info(f"Browser launched: {browser_type}, headless={headless}, user_agent={user_agent[:50]}...")
    
    async def _close_browser(self):
        """
        Закрывает браузер
        """
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        logger.info("Browser closed")
    
    async def scrape_search_query(self, query: str, max_ads: int = 10) -> List[Dict[str, Any]]:
        """
        Выполняет поиск по запросу и собирает объявления
        
        Args:
            query: Поисковый запрос
            max_ads: Максимум объявлений для сбора
            
        Returns:
            Список словарей с данными объявлений
        """
        logger.info(f"Starting scrape for query: '{query}', max_ads: {max_ads}")
        
        results = []
        page_num = 1
        
        while len(results) < max_ads:
            # Формируем URL поиска
            search_url = self._build_search_url(query, page_num)
            
            # Проверяем robots.txt
            if self.robots and not self.robots.can_fetch(search_url):
                logger.warning(f"robots.txt disallows: {search_url}")
                break
            
            # Rate limiting
            await self.rate_limiter.wait()
            
            # Получаем список объявлений на странице
            logger.info(f"Fetching search page {page_num}: {search_url}")
            
            try:
                listings = await self._scrape_search_page(search_url)
                
                if not listings:
                    logger.info(f"No more listings found on page {page_num}")
                    break
                
                logger.info(f"Found {len(listings)} listings on page {page_num}")
                
                # Собираем детальную информацию для каждого объявления
                for listing_url in listings:
                    if len(results) >= max_ads:
                        break
                    
                    # Rate limiting
                    await self.rate_limiter.wait()
                    
                    # Парсим страницу объявления
                    ad_data = await self._scrape_ad_page(listing_url, query)
                    
                    if ad_data:
                        results.append(ad_data)
                        logger.info(f"Scraped ad {len(results)}/{max_ads}: {ad_data['title'][:50]}...")
                
                page_num += 1
                
            except Exception as e:
                logger.error(f"Error scraping page {page_num}: {e}")
                break
        
        logger.info(f"Scraping complete for '{query}': {len(results)} ads collected")
        return results
    
    def _build_search_url(self, query: str, page: int = 1) -> str:
        """
        Строит URL для поиска
        
        Args:
            query: Поисковый запрос
            page: Номер страницы
            
        Returns:
            URL строка
        """
        encoded_query = quote_plus(query)
        url = self.SEARCH_URL.format(query=encoded_query)
        
        if page > 1:
            url += f"?page={page}"
        
        return url
    
    async def _scrape_search_page(self, url: str) -> List[str]:
        """
        Парсит страницу поиска и возвращает URL объявлений
        
        Args:
            url: URL страницы поиска
            
        Returns:
            Список URL объявлений
        """
        page = await self.context.new_page()
        
        try:
            # Переход на страницу
            await page.goto(url, timeout=self.config['page_timeout'], wait_until='domcontentloaded')
            
            # Небольшая задержка для загрузки JS
            await page.wait_for_timeout(2000)
            
            # Проверка на CAPTCHA
            content = await page.content()
            if is_captcha_present(content):
                logger.warning(f"CAPTCHA detected on search page: {url}")
                
                # Скриншот
                screenshot_path = await self._save_captcha_screenshot(page, url)
                
                # Добавляем в очередь ручной проверки
                add_to_manual_review(url, "CAPTCHA on search page", screenshot_path)
                
                return []
            
            # Ищем все ссылки на объявления
            # OLX использует data-cy="l-card" для карточек объявлений
            listings = await page.locator('[data-cy="l-card"] a[href*="/d/oferty/"]').all()
            
            # Извлекаем URL
            urls = []
            for listing in listings:
                href = await listing.get_attribute('href')
                if href:
                    full_url = urljoin(self.BASE_URL, href)
                    urls.append(full_url)
            
            # Удаляем дубликаты
            urls = list(dict.fromkeys(urls))
            
            logger.debug(f"Found {len(urls)} unique listing URLs on page")
            
            return urls
            
        except PlaywrightTimeoutError:
            logger.error(f"Timeout loading search page: {url}")
            return []
            
        except Exception as e:
            logger.error(f"Error scraping search page {url}: {e}")
            
            if self.config['screenshot_on_error']:
                await self._save_error_screenshot(page, url)
            
            return []
            
        finally:
            await page.close()
    
    async def _scrape_ad_page(self, url: str, search_query: str) -> Optional[Dict[str, Any]]:
        """
        Парсит страницу отдельного объявления
        
        Args:
            url: URL объявления
            search_query: Поисковый запрос (для метаданных)
            
        Returns:
            Словарь с данными объявления или None при ошибке
        """
        # Проверяем robots.txt
        if self.robots and not self.robots.can_fetch(url):
            logger.warning(f"robots.txt disallows ad: {url}")
            return None
        
        page = await self.context.new_page()
        
        try:
            logger.debug(f"Scraping ad page: {url}")
            
            # Переход на страницу
            await page.goto(url, timeout=self.config['page_timeout'], wait_until='domcontentloaded')
            
            # Ждём загрузки контента
            await page.wait_for_timeout(2000)
            
            # Проверка на CAPTCHA
            content = await page.content()
            if is_captcha_present(content):
                logger.warning(f"CAPTCHA detected on ad page: {url}")
                
                screenshot_path = await self._save_captcha_screenshot(page, url)
                add_to_manual_review(url, "CAPTCHA on ad page", screenshot_path)
                
                return None
            
            # Парсим данные объявления
            ad_data = await self._extract_ad_data(page, url, search_query)
            
            return ad_data
            
        except PlaywrightTimeoutError:
            logger.error(f"Timeout loading ad page: {url}")
            return None
            
        except Exception as e:
            logger.error(f"Error scraping ad {url}: {e}")
            
            if self.config['screenshot_on_error']:
                await self._save_error_screenshot(page, url)
            
            return None
            
        finally:
            await page.close()
    
    async def _extract_ad_data(self, page: Page, url: str, search_query: str) -> Dict[str, Any]:
        """
        Извлекает данные из страницы объявления
        
        Args:
            page: Playwright Page объект
            url: URL объявления
            search_query: Поисковый запрос
            
        Returns:
            Словарь с данными
        """
        data = {
            'url': url,
            'id': extract_id_from_url(url),
            'search_query': search_query,
            'scraped_at': datetime.now().isoformat()
        }
        
        # Заголовок
        try:
            title_el = await page.locator('h1, h4[data-cy="ad_title"]').first.text_content(timeout=5000)
            data['title'] = clean_text(title_el)
        except:
            data['title'] = ""
            logger.warning(f"Could not extract title from {url}")
        
        # Цена
        try:
            price_el = await page.locator('h3[data-testid="ad-price-container"]').first.text_content(timeout=5000)
            data['price'] = parse_price(price_el)
            data['currency'] = 'PLN' if 'zł' in price_el else None
        except:
            data['price'] = None
            data['currency'] = None
            logger.warning(f"Could not extract price from {url}")
        
        # Описание
        try:
            desc_el = await page.locator('[data-cy="ad_description"]').first.text_content(timeout=5000)
            data['description'] = clean_text(desc_el)
        except:
            data['description'] = ""
            logger.warning(f"Could not extract description from {url}")
        
        # Локация
        try:
            loc_el = await page.locator('[data-testid="location-date"]').first.text_content(timeout=5000)
            location_parts = loc_el.split('-')
            data['location'] = clean_text(location_parts[0]) if location_parts else ""
        except:
            data['location'] = ""
        
        # Дата публикации
        try:
            date_el = await page.locator('[data-testid="location-date"]').first.text_content(timeout=5000)
            date_parts = date_el.split('-')
            if len(date_parts) > 1:
                data['date'] = clean_text(date_parts[1])
            else:
                data['date'] = ""
        except:
            data['date'] = ""
        
        # Изображения
        images = []
        try:
            img_elements = await page.locator('[data-testid="swiper-image-slide"] img, .swiper-slide img').all()
            
            for img_el in img_elements[:10]:  # Максимум 10 изображений
                img_src = await img_el.get_attribute('src')
                if img_src and img_src.startswith('http'):
                    images.append(img_src)
                    
                    # Скачиваем изображение если нужно
                    if self.config['download_images']:
                        filename = f"{data['id']}_{len(images)}.jpg"
                        local_path = await download_image(
                            img_src,
                            self.config['images_dir'],
                            filename
                        )
                        if local_path:
                            images.append(local_path)
            
            data['images'] = images
            
        except Exception as e:
            logger.warning(f"Could not extract images: {e}")
            data['images'] = []
        
        logger.debug(f"Extracted ad data: title={data['title'][:30]}, price={data['price']}, images={len(images)}")
        
        return data
    
    async def _save_captcha_screenshot(self, page: Page, url: str) -> str:
        """
        Сохраняет скриншот страницы с CAPTCHA
        
        Returns:
            Путь к скриншоту
        """
        import os
        from pathlib import Path
        
        captcha_dir = self.config['captcha_dir']
        Path(captcha_dir).mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"captcha_{timestamp}.png"
        filepath = os.path.join(captcha_dir, filename)
        
        await page.screenshot(path=filepath, full_page=True)
        logger.info(f"CAPTCHA screenshot saved: {filepath}")
        
        return filepath
    
    async def _save_error_screenshot(self, page: Page, url: str):
        """
        Сохраняет скриншот при ошибке
        """
        import os
        from pathlib import Path
        
        error_dir = './data/error_screenshots'
        Path(error_dir).mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"error_{timestamp}.png"
        filepath = os.path.join(error_dir, filename)
        
        try:
            await page.screenshot(path=filepath)
            logger.info(f"Error screenshot saved: {filepath}")
        except:
            pass


# ========================================
# Главная функция для тестирования
# ========================================

async def main():
    """
    Тестовый запуск scraper
    """
    from .utils import load_config, load_user_agents, setup_logging
    
    # Загружаем конфиг
    config = load_config()
    
    # Настраиваем логирование
    setup_logging(config['log_level'], config['log_file'], config['log_console'])
    
    # Загружаем User-Agents
    user_agents = load_user_agents(config['user_agents_file'])
    
    # Создаём scraper
    async with OLXScraper(config, user_agents) as scraper:
        # Тестовый поиск
        results = await scraper.scrape_search_query("rtx 3060", max_ads=3)
        
        # Выводим результаты
        for i, ad in enumerate(results, 1):
            print(f"\n{'='*60}")
            print(f"Ad {i}:")
            print(f"Title: {ad['title']}")
            print(f"Price: {ad['price']} {ad['currency']}")
            print(f"URL: {ad['url']}")
            print(f"Images: {len(ad['images'])}")


if __name__ == '__main__':
    asyncio.run(main())
