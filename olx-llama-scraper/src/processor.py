"""
Main Processor - Главный процессор OLX Scraper

Функционал:
- Координирует работу scraper и llm_bridge
- Отправляет результаты на webhook
- Обрабатывает ошибки и retry
- Логирование всего процесса
"""

import asyncio
import json
from typing import List, Dict, Any
from datetime import datetime
import requests
from playwright.async_api import async_playwright
from loguru import logger

from .utils import (
    load_config,
    setup_logging,
    load_user_agents
)
from .scraper import OLXScraper
from .llm_bridge import LlamaBridge, compute_simple_rating


class OLXProcessor:
    """
    Главный процессор - координирует весь pipeline
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Args:
            config: Конфигурация из utils.load_config()
        """
        self.config = config
        self.webhook_url = config['webhook_url']
        self.webhook_timeout = config['webhook_timeout']
        self.webhook_retries = config['webhook_retries']
        
        logger.info("OLXProcessor initialized")
    
    async def process_all_queries(self):
        """
        Обрабатывает все поисковые запросы из конфига
        """
        queries = [q.strip() for q in self.config['search_queries'] if q.strip()]
        max_ads = self.config['max_ads']
        
        if not queries:
            logger.error("No search queries specified in config")
            return
        
        logger.info(f"Processing {len(queries)} search queries, max {max_ads} ads each")
        
        # Запускаем Playwright
        async with async_playwright() as playwright:
            # Запускаем браузер
            browser_type = self.config['browser_type']
            headless = self.config['headless']
            
            if browser_type == 'chromium':
                browser = await playwright.chromium.launch(headless=headless)
            elif browser_type == 'firefox':
                browser = await playwright.firefox.launch(headless=headless)
            else:
                browser = await playwright.webkit.launch(headless=headless)
            
            try:
                # Загружаем User-Agents
                user_agents = load_user_agents(self.config['user_agents_file'])
                
                # Создаём scraper
                scraper = OLXScraper(self.config, user_agents)
                await scraper._init_browser()
                
                # Создаём Llama bridge
                llama_bridge = LlamaBridge(self.config, browser)
                
                # Обрабатываем каждый запрос
                for query in queries:
                    logger.info(f"\n{'='*60}")
                    logger.info(f"Processing query: '{query}'")
                    logger.info(f"{'='*60}\n")
                    
                    await self._process_single_query(
                        query,
                        max_ads,
                        scraper,
                        llama_bridge
                    )
                
                # Закрываем scraper
                await scraper._close_browser()
                
            finally:
                await browser.close()
        
        logger.info("\n✅ All queries processed successfully!")
    
    async def _process_single_query(
        self,
        query: str,
        max_ads: int,
        scraper: OLXScraper,
        llama_bridge: LlamaBridge
    ):
        """
        Обрабатывает один поисковый запрос
        
        Args:
            query: Поисковый запрос
            max_ads: Максимум объявлений
            scraper: OLXScraper instance
            llama_bridge: LlamaBridge instance
        """
        try:
            # Скрапим объявления
            ads = await scraper.scrape_search_query(query, max_ads)
            
            if not ads:
                logger.warning(f"No ads found for query: '{query}'")
                return
            
            logger.info(f"Found {len(ads)} ads for query '{query}', starting analysis...")
            
            # Обрабатываем каждое объявление
            for i, ad_data in enumerate(ads, 1):
                logger.info(f"\n--- Processing ad {i}/{len(ads)} ---")
                logger.info(f"Title: {ad_data.get('title', 'Unknown')[:50]}...")
                
                try:
                    # AI анализ через Llama
                    ai_analysis = await llama_bridge.analyze_ad(ad_data)
                    
                    # Вычисляем fallback рейтинг
                    fallback_score = compute_simple_rating(ad_data)
                    
                    # Формируем итоговый payload
                    payload = self._build_payload(ad_data, ai_analysis, fallback_score)
                    
                    # Отправляем на webhook
                    success = await self._send_to_webhook(payload)
                    
                    if success:
                        logger.info(f"✅ Ad {i} processed and sent successfully")
                    else:
                        logger.error(f"❌ Failed to send ad {i} to webhook")
                    
                    # Небольшая задержка между объявлениями
                    await asyncio.sleep(1)
                    
                except Exception as e:
                    logger.error(f"Error processing ad {i}: {e}")
                    continue
            
            logger.info(f"\n✅ Query '{query}' completed: {len(ads)} ads processed")
            
        except Exception as e:
            logger.error(f"Error processing query '{query}': {e}")
    
    def _build_payload(
        self,
        ad_data: Dict[str, Any],
        ai_analysis: Dict[str, Any],
        fallback_score: int
    ) -> Dict[str, Any]:
        """
        Формирует итоговый payload для отправки на webhook
        
        Args:
            ad_data: Данные объявления от scraper
            ai_analysis: AI анализ от Llama
            fallback_score: Эвристический рейтинг
            
        Returns:
            Словарь с полным набором данных
        """
        payload = {
            # Основные данные
            'url': ad_data.get('url'),
            'id': ad_data.get('id'),
            'title': ad_data.get('title'),
            'price': ad_data.get('price'),
            'currency': ad_data.get('currency'),
            'description': ad_data.get('description'),
            'images': ad_data.get('images', []),
            'date': ad_data.get('date'),
            'location': ad_data.get('location'),
            
            # AI анализ
            'ai_analysis': {
                'summary': ai_analysis.get('summary'),
                'selling_points': ai_analysis.get('selling_points', []),
                'score': ai_analysis.get('score'),
                'reasoning': ai_analysis.get('reasoning'),
                'missing_fields': ai_analysis.get('missing_fields', []),
                'is_fallback': ai_analysis.get('fallback', False)
            },
            
            # Дополнительные метрики
            'fallback_score': fallback_score,
            
            # Метаданные
            'metadata': {
                'scraped_at': ad_data.get('scraped_at'),
                'source': 'olx.pl',
                'search_query': ad_data.get('search_query'),
                'processor_version': '1.0.0'
            }
        }
        
        return payload
    
    async def _send_to_webhook(self, payload: Dict[str, Any]) -> bool:
        """
        Отправляет данные на webhook с retry механизмом
        
        Args:
            payload: Данные для отправки
            
        Returns:
            True если успешно, False при ошибке
        """
        for attempt in range(1, self.webhook_retries + 1):
            try:
                logger.debug(f"Sending to webhook (attempt {attempt}/{self.webhook_retries}): {self.webhook_url}")
                
                # Отправляем POST запрос
                response = requests.post(
                    self.webhook_url,
                    json=payload,
                    timeout=self.webhook_timeout,
                    headers={
                        'Content-Type': 'application/json',
                        'User-Agent': 'OLX-Scraper/1.0'
                    }
                )
                
                response.raise_for_status()
                
                logger.info(f"Webhook response: {response.status_code}")
                logger.debug(f"Response body: {response.text[:200]}")
                
                return True
                
            except requests.exceptions.Timeout:
                logger.warning(f"Webhook timeout (attempt {attempt})")
                
                if attempt < self.webhook_retries:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Webhook request error (attempt {attempt}): {e}")
                
                if attempt < self.webhook_retries:
                    await asyncio.sleep(2 ** attempt)
                
            except Exception as e:
                logger.error(f"Unexpected webhook error (attempt {attempt}): {e}")
                break
        
        # Сохраняем payload локально если не удалось отправить
        self._save_failed_payload(payload)
        
        return False
    
    def _save_failed_payload(self, payload: Dict[str, Any]):
        """
        Сохраняет payload локально если webhook недоступен
        
        Args:
            payload: Данные для сохранения
        """
        import os
        from pathlib import Path
        
        failed_dir = './data/failed_webhooks'
        Path(failed_dir).mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"failed_{timestamp}_{payload.get('id', 'unknown')}.json"
        filepath = os.path.join(failed_dir, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Failed payload saved locally: {filepath}")
            
        except Exception as e:
            logger.error(f"Could not save failed payload: {e}")


# ========================================
# Главная функция
# ========================================

async def main():
    """
    Точка входа в программу
    """
    try:
        # Загружаем конфигурацию
        logger.info("Loading configuration...")
        config = load_config()
        
        # Настраиваем логирование
        setup_logging(
            log_level=config['log_level'],
            log_file=config['log_file'],
            console=config['log_console']
        )
        
        logger.info("="*60)
        logger.info("🚀 OLX Scraper + Llama 4 AI Integration")
        logger.info("="*60)
        logger.info(f"Search queries: {', '.join(config['search_queries'])}")
        logger.info(f"Max ads per query: {config['max_ads']}")
        logger.info(f"Webhook URL: {config['webhook_url']}")
        logger.info(f"Llama URL: {config['llama_url']}")
        logger.info(f"Headless mode: {config['headless']}")
        logger.info("="*60 + "\n")
        
        # Создаём и запускаем processor
        processor = OLXProcessor(config)
        await processor.process_all_queries()
        
        logger.info("\n" + "="*60)
        logger.info("✅ Processing completed successfully!")
        logger.info("="*60)
        
    except KeyboardInterrupt:
        logger.warning("\n⚠️ Interrupted by user")
        
    except Exception as e:
        logger.error(f"\n❌ Fatal error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise


if __name__ == '__main__':
    # Запускаем main через asyncio
    asyncio.run(main())
