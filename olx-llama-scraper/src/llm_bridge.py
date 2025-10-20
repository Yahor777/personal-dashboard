"""
Llama 4 Bridge - Интеграция с Llama 4 Maverick через Web UI

Функционал:
- Формирование промтов для AI анализа объявлений
- Автоматизация веб-интерфейса Llama 4 через Playwright
- Парсинг JSON ответов от модели
- Retry механизм для некорректных JSON
- Fallback эвристический рейтинг
"""

import json
import asyncio
from typing import Dict, Any, Optional, Tuple
from playwright.async_api import Page, Browser, TimeoutError as PlaywrightTimeoutError
from loguru import logger


class LlamaBridge:
    """
    Мост между scraper и Llama 4 Maverick web UI
    """
    
    # Шаблон system промта
    SYSTEM_PROMPT = """Ты — аналитик объявлений OLX. Твоя задача — по входным данным объявления вернуть JSON со следующими полями:
{
  "summary": "Одно-две фразы — краткий обзор объявления",
  "selling_points": ["краткая польза 1", "польза 2", "польза 3"],
  "score": 0,                // целое 0-100
  "reasoning": "пару предложений, почему такой score",
  "missing_fields": []       // список, если чего-то не хватает (price, images, description)
}

Выполни преобразование и отдай только JSON (никакого лишнего текста)."""
    
    def __init__(self, config: Dict[str, Any], browser: Browser):
        """
        Args:
            config: Конфигурация из utils.load_config()
            browser: Playwright Browser instance
        """
        self.config = config
        self.browser = browser
        self.llama_url = config['llama_url']
        self.timeout = config['llama_timeout'] * 1000  # в миллисекундах
        self.max_retries = config['llama_retries']
        
        logger.info(f"LlamaBridge initialized: url={self.llama_url}, timeout={self.timeout}ms")
    
    async def analyze_ad(self, ad_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Анализирует объявление через Llama 4
        
        Args:
            ad_data: Данные объявления от scraper
            
        Returns:
            Словарь с AI анализом:
            {
                'summary': str,
                'selling_points': List[str],
                'score': int,
                'reasoning': str,
                'missing_fields': List[str]
            }
        """
        logger.info(f"Analyzing ad with Llama 4: {ad_data.get('title', 'Unknown')[:50]}...")
        
        # Формируем промт
        user_prompt = self._build_user_prompt(ad_data)
        
        # Пытаемся получить ответ от Llama
        for attempt in range(1, self.max_retries + 1):
            try:
                logger.debug(f"Llama attempt {attempt}/{self.max_retries}")
                
                # Отправляем промт и получаем ответ
                response_text = await self._query_llama(user_prompt, attempt > 1)
                
                # Парсим JSON
                analysis = self._parse_json_response(response_text)
                
                if analysis:
                    logger.info(f"Llama analysis successful: score={analysis.get('score')}")
                    return analysis
                else:
                    logger.warning(f"Invalid JSON from Llama (attempt {attempt})")
                    
                    # Для повторной попытки просим исправить JSON
                    if attempt < self.max_retries:
                        user_prompt = f"Предыдущий ответ был некорректным JSON. Пожалуйста, верни ТОЛЬКО валидный JSON без лишнего текста:\n{response_text}"
                        await asyncio.sleep(2)  # Небольшая задержка
                
            except Exception as e:
                logger.error(f"Llama query failed (attempt {attempt}): {e}")
                
                if attempt < self.max_retries:
                    await asyncio.sleep(3)
        
        # Если все попытки провалились - используем fallback
        logger.warning("All Llama attempts failed, using fallback rating")
        return self._compute_fallback_analysis(ad_data)
    
    def _build_user_prompt(self, ad_data: Dict[str, Any]) -> str:
        """
        Формирует user промт из данных объявления
        
        Args:
            ad_data: Данные объявления
            
        Returns:
            Промт строка
        """
        # Формируем список изображений
        images_str = ", ".join(ad_data.get('images', [])[:5]) if ad_data.get('images') else "нет изображений"
        
        prompt = f"""Проанализируй это объявление с OLX:

URL: {ad_data.get('url', 'N/A')}
Title: {ad_data.get('title', 'N/A')}
Price: {ad_data.get('price', 'N/A')} {ad_data.get('currency', '')}
Description: {ad_data.get('description', 'N/A')[:500]}
Images: {images_str}
Date: {ad_data.get('date', 'N/A')}
Location: {ad_data.get('location', 'N/A')}

Верни только JSON без дополнительного текста."""
        
        return prompt
    
    async def _query_llama(self, user_prompt: str, is_retry: bool = False) -> str:
        """
        Отправляет промт в Llama 4 web UI и получает ответ
        
        Args:
            user_prompt: User message
            is_retry: Это повторная попытка (для исправления JSON)
            
        Returns:
            Текст ответа от модели
        """
        page = await self.browser.new_page()
        
        try:
            logger.debug(f"Opening Llama web UI: {self.llama_url}")
            
            # Открываем страницу чата
            await page.goto(self.llama_url, timeout=self.timeout, wait_until='networkidle')
            
            # Ждём загрузки интерфейса
            await page.wait_for_timeout(2000)
            
            # Находим textarea для ввода (селектор зависит от конкретной реализации web UI)
            # Пример для распространённых UI: text-generation-webui, oobabooga
            textarea_selectors = [
                'textarea[placeholder*="message"]',
                'textarea[name="message"]',
                'textarea#textbox',
                'textarea.chat-input',
                '#user-input',
                'textarea'
            ]
            
            textarea = None
            for selector in textarea_selectors:
                try:
                    textarea = await page.locator(selector).first
                    if await textarea.is_visible(timeout=2000):
                        logger.debug(f"Found textarea with selector: {selector}")
                        break
                except:
                    continue
            
            if not textarea:
                raise Exception("Could not find chat input textarea")
            
            # Если это первая попытка - отправляем system prompt
            if not is_retry:
                await textarea.fill(self.SYSTEM_PROMPT)
                await textarea.press('Enter')
                await page.wait_for_timeout(1000)
            
            # Отправляем user prompt
            await textarea.fill(user_prompt)
            
            # Находим кнопку отправки
            send_button_selectors = [
                'button:has-text("Send")',
                'button:has-text("Submit")',
                'button[type="submit"]',
                'button.send-button',
                '#send-btn'
            ]
            
            for selector in send_button_selectors:
                try:
                    button = await page.locator(selector).first
                    if await button.is_visible(timeout=1000):
                        await button.click()
                        logger.debug(f"Clicked send button: {selector}")
                        break
                except:
                    continue
            
            # Ждём ответа от модели
            # Обычно ответ появляется в элементе с классом типа .bot-message, .assistant-message
            logger.debug("Waiting for Llama response...")
            
            await page.wait_for_timeout(3000)  # Даём время на генерацию
            
            # Ищем последнее сообщение от ассистента
            response_selectors = [
                '.bot-message:last-of-type',
                '.assistant-message:last-of-type',
                '[data-role="assistant"]:last-of-type',
                '.message.bot:last-of-type',
                '.response:last-of-type'
            ]
            
            response_text = ""
            for selector in response_selectors:
                try:
                    response_el = await page.locator(selector).first
                    if await response_el.is_visible(timeout=2000):
                        response_text = await response_el.text_content()
                        if response_text and len(response_text) > 10:
                            logger.debug(f"Got response with selector: {selector}")
                            break
                except:
                    continue
            
            # Если не нашли через селекторы - берём весь текст страницы и ищем JSON
            if not response_text:
                page_content = await page.content()
                # Ищем JSON блок в контенте
                import re
                json_match = re.search(r'\{[\s\S]*?"summary"[\s\S]*?\}', page_content)
                if json_match:
                    response_text = json_match.group(0)
            
            if not response_text:
                raise Exception("Could not extract response from Llama UI")
            
            logger.debug(f"Llama response received: {len(response_text)} chars")
            
            return response_text
            
        except PlaywrightTimeoutError:
            logger.error(f"Timeout querying Llama: {self.llama_url}")
            raise
            
        except Exception as e:
            logger.error(f"Error querying Llama: {e}")
            raise
            
        finally:
            await page.close()
    
    def _parse_json_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """
        Парсит JSON из ответа модели
        
        Args:
            response_text: Текст ответа от Llama
            
        Returns:
            Распарсенный JSON или None при ошибке
        """
        try:
            # Убираем markdown code blocks если есть
            import re
            
            # Удаляем ```json и ```
            cleaned = re.sub(r'```json\s*', '', response_text)
            cleaned = re.sub(r'```\s*$', '', cleaned)
            
            # Ищем JSON объект
            json_match = re.search(r'\{[\s\S]*\}', cleaned)
            
            if json_match:
                json_str = json_match.group(0)
                data = json.loads(json_str)
                
                # Валидация структуры
                required_fields = ['summary', 'selling_points', 'score', 'reasoning']
                
                if all(field in data for field in required_fields):
                    # Проверяем типы
                    if (isinstance(data['summary'], str) and
                        isinstance(data['selling_points'], list) and
                        isinstance(data['score'], int) and
                        isinstance(data['reasoning'], str)):
                        
                        # Добавляем missing_fields если нет
                        if 'missing_fields' not in data:
                            data['missing_fields'] = []
                        
                        logger.debug("JSON validation successful")
                        return data
            
            logger.warning("JSON validation failed: missing or invalid fields")
            return None
            
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error: {e}")
            return None
            
        except Exception as e:
            logger.error(f"Error parsing JSON response: {e}")
            return None
    
    def _compute_fallback_analysis(self, ad_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Вычисляет простой эвристический рейтинг если Llama недоступна
        
        Args:
            ad_data: Данные объявления
            
        Returns:
            Fallback анализ
        """
        logger.info("Computing fallback heuristic rating")
        
        score = 50  # Базовый score
        missing_fields = []
        selling_points = []
        
        # Проверяем наличие основных полей
        if not ad_data.get('price'):
            missing_fields.append('price')
            score -= 10
        else:
            selling_points.append(f"Цена: {ad_data['price']} {ad_data.get('currency', '')}")
        
        if not ad_data.get('description') or len(ad_data.get('description', '')) < 20:
            missing_fields.append('description')
            score -= 15
        else:
            score += 10
            selling_points.append("Детальное описание")
        
        if not ad_data.get('images') or len(ad_data.get('images', [])) == 0:
            missing_fields.append('images')
            score -= 20
        else:
            num_images = len(ad_data['images'])
            score += min(num_images * 5, 20)
            selling_points.append(f"{num_images} фото")
        
        if ad_data.get('location'):
            selling_points.append(f"Локация: {ad_data['location']}")
        
        # Ограничиваем score диапазоном 0-100
        score = max(0, min(100, score))
        
        analysis = {
            'summary': f"Объявление: {ad_data.get('title', 'Без названия')[:50]}",
            'selling_points': selling_points[:3] if selling_points else ['Базовое объявление'],
            'score': score,
            'reasoning': f"Эвристический рейтинг на основе наличия полей. Отсутствуют: {', '.join(missing_fields) if missing_fields else 'нет'}",
            'missing_fields': missing_fields,
            'fallback': True  # Флаг что это fallback
        }
        
        logger.info(f"Fallback rating computed: score={score}")
        
        return analysis


# ========================================
# Вспомогательная функция для простого рейтинга
# ========================================

def compute_simple_rating(ad_data: Dict[str, Any]) -> int:
    """
    Простая функция для вычисления рейтинга без AI
    
    Args:
        ad_data: Данные объявления
        
    Returns:
        Рейтинг 0-100
    """
    score = 50
    
    # Есть цена
    if ad_data.get('price'):
        score += 10
    
    # Есть описание
    if ad_data.get('description') and len(ad_data['description']) > 50:
        score += 15
    
    # Есть изображения
    num_images = len(ad_data.get('images', []))
    if num_images > 0:
        score += min(num_images * 5, 25)
    
    # Есть локация
    if ad_data.get('location'):
        score += 5
    
    # Есть дата
    if ad_data.get('date'):
        score += 5
    
    return max(0, min(100, score))


# ========================================
# Тестирование
# ========================================

async def test_llama_bridge():
    """
    Тест LlamaBridge
    """
    from playwright.async_api import async_playwright
    from .utils import load_config, setup_logging
    
    # Загружаем конфиг
    config = load_config()
    setup_logging(config['log_level'], None, True)
    
    # Тестовые данные
    test_ad = {
        'url': 'https://www.olx.pl/d/oferty/test',
        'title': 'MSI GeForce RTX 3060 Gaming X 12GB',
        'price': 1299.0,
        'currency': 'PLN',
        'description': 'Karta graficzna w bardzo dobrym stanie. Używana do gier. Nie kopalnia.',
        'images': ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        'date': 'dzisiaj',
        'location': 'Warszawa'
    }
    
    # Запускаем Playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)  # headful для debug
        
        try:
            bridge = LlamaBridge(config, browser)
            
            # Анализируем
            analysis = await bridge.analyze_ad(test_ad)
            
            print("\n" + "="*60)
            print("AI Analysis:")
            print(json.dumps(analysis, indent=2, ensure_ascii=False))
            print("="*60)
            
        finally:
            await browser.close()


if __name__ == '__main__':
    asyncio.run(test_llama_bridge())
