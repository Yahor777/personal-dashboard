"""
Утилиты для OLX Scraper
- Логирование
- Rate limiting
- Парсинг robots.txt
- Скачивание изображений
- Вспомогательные функции
"""

import os
import re
import json
import time
import random
import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
from urllib.parse import urlparse
import requests
from loguru import logger
from ratelimit import limits, sleep_and_retry
from robotexclusionrulesparser import RobotExclusionRulesParser
from PIL import Image
from io import BytesIO


# ========================================
# Настройка Логирования
# ========================================

def setup_logging(log_level: str = "INFO", log_file: Optional[str] = None, console: bool = True):
    """
    Настраивает систему логирования
    
    Args:
        log_level: Уровень логирования (DEBUG/INFO/WARNING/ERROR)
        log_file: Путь к файлу логов (опционально)
        console: Выводить логи в консоль
    """
    # Удаляем дефолтный handler
    logger.remove()
    
    # Формат логов (без конфиденциальных данных)
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    
    # Console logging
    if console:
        logger.add(
            sink=lambda msg: print(msg, end=""),
            format=log_format,
            level=log_level,
            colorize=True
        )
    
    # File logging
    if log_file:
        # Создаём директорию если не существует
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        
        logger.add(
            sink=log_file,
            format=log_format,
            level=log_level,
            rotation="10 MB",  # Ротация при достижении 10 MB
            retention="7 days",  # Храним логи 7 дней
            compression="zip"  # Сжимаем старые логи
        )
    
    logger.info(f"Logging initialized: level={log_level}, file={log_file}")


# ========================================
# Rate Limiting
# ========================================

class RateLimiter:
    """
    Token bucket rate limiter с jitter
    """
    
    def __init__(self, calls_per_minute: int = 10, min_delay: float = 0.8, max_delay: float = 2.5):
        """
        Args:
            calls_per_minute: Максимум вызовов в минуту
            min_delay: Минимальная задержка между вызовами (сек)
            max_delay: Максимальная задержка между вызовами (сек)
        """
        self.calls_per_minute = calls_per_minute
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.last_call = 0.0
        
        logger.info(f"RateLimiter initialized: {calls_per_minute} calls/min, delay {min_delay}-{max_delay}s")
    
    async def wait(self):
        """
        Асинхронное ожидание с jitter
        """
        # Рассчитываем задержку с jitter
        delay = random.uniform(self.min_delay, self.max_delay)
        
        # Дополнительная задержка если превышен лимит
        now = time.time()
        time_since_last = now - self.last_call
        min_interval = 60.0 / self.calls_per_minute
        
        if time_since_last < min_interval:
            additional_delay = min_interval - time_since_last
            delay += additional_delay
        
        logger.debug(f"Rate limit delay: {delay:.2f}s")
        await asyncio.sleep(delay)
        
        self.last_call = time.time()


# ========================================
# Robots.txt Parser
# ========================================

class RobotsParser:
    """
    Парсер robots.txt с кешированием
    """
    
    def __init__(self, robots_url: str):
        """
        Args:
            robots_url: URL к robots.txt
        """
        self.robots_url = robots_url
        self.parser = RobotExclusionRulesParser()
        self.loaded = False
        
        logger.info(f"RobotsParser initialized for: {robots_url}")
    
    def load(self):
        """
        Загружает и парсит robots.txt
        """
        try:
            logger.info(f"Fetching robots.txt from {self.robots_url}")
            response = requests.get(self.robots_url, timeout=10)
            response.raise_for_status()
            
            self.parser.parse(response.text)
            self.loaded = True
            logger.info("robots.txt loaded successfully")
            
        except Exception as e:
            logger.warning(f"Failed to load robots.txt: {e}. Continuing anyway...")
            self.loaded = False
    
    def can_fetch(self, url: str, user_agent: str = "*") -> bool:
        """
        Проверяет можно ли получить URL
        
        Args:
            url: URL для проверки
            user_agent: User-Agent string
            
        Returns:
            True если разрешено, False если запрещено
        """
        if not self.loaded:
            self.load()
        
        if not self.loaded:
            # Если не удалось загрузить - разрешаем
            return True
        
        allowed = self.parser.is_allowed(user_agent, url)
        
        if not allowed:
            logger.warning(f"robots.txt disallows: {url}")
        
        return allowed


# ========================================
# Image Downloader
# ========================================

async def download_image(
    url: str,
    save_dir: str,
    filename: Optional[str] = None,
    max_size_mb: int = 10
) -> Optional[str]:
    """
    Скачивает изображение с проверками
    
    Args:
        url: URL изображения
        save_dir: Директория для сохранения
        filename: Имя файла (опционально, генерируется автоматически)
        max_size_mb: Максимальный размер файла в MB
        
    Returns:
        Путь к скачанному файлу или None при ошибке
    """
    try:
        # Создаём директорию
        Path(save_dir).mkdir(parents=True, exist_ok=True)
        
        # Скачиваем изображение
        logger.debug(f"Downloading image: {url}")
        response = requests.get(url, timeout=15, stream=True)
        response.raise_for_status()
        
        # Проверяем размер
        content_length = response.headers.get('content-length')
        if content_length and int(content_length) > max_size_mb * 1024 * 1024:
            logger.warning(f"Image too large: {content_length} bytes > {max_size_mb}MB")
            return None
        
        # Читаем контент
        image_data = response.content
        
        # Проверяем что это изображение
        try:
            img = Image.open(BytesIO(image_data))
            img.verify()
            
            # Генерируем имя файла если не указано
            if not filename:
                ext = img.format.lower() if img.format else 'jpg'
                filename = f"{int(time.time())}_{random.randint(1000, 9999)}.{ext}"
            
            # Сохраняем
            filepath = os.path.join(save_dir, filename)
            with open(filepath, 'wb') as f:
                f.write(image_data)
            
            logger.info(f"Image saved: {filepath} ({len(image_data)} bytes)")
            return filepath
            
        except Exception as e:
            logger.error(f"Invalid image data: {e}")
            return None
            
    except Exception as e:
        logger.error(f"Failed to download image {url}: {e}")
        return None


# ========================================
# Manual Review Queue
# ========================================

def add_to_manual_review(url: str, reason: str, screenshot_path: Optional[str] = None):
    """
    Добавляет URL в очередь ручной проверки
    
    Args:
        url: URL для проверки
        reason: Причина (например, "CAPTCHA detected")
        screenshot_path: Путь к скриншоту
    """
    queue_file = os.getenv('MANUAL_REVIEW_FILE', './manual_review.json')
    
    # Создаём файл если не существует
    if not os.path.exists(queue_file):
        with open(queue_file, 'w') as f:
            json.dump([], f)
    
    # Читаем текущую очередь
    try:
        with open(queue_file, 'r') as f:
            queue = json.load(f)
    except:
        queue = []
    
    # Добавляем новую запись
    entry = {
        'url': url,
        'reason': reason,
        'screenshot': screenshot_path,
        'timestamp': datetime.now().isoformat(),
        'status': 'pending'
    }
    
    queue.append(entry)
    
    # Сохраняем
    with open(queue_file, 'w') as f:
        json.dump(queue, f, indent=2)
    
    logger.warning(f"Added to manual review: {url} (reason: {reason})")


# ========================================
# User Agent Rotation
# ========================================

def load_user_agents(filepath: str) -> List[str]:
    """
    Загружает список User-Agent из файла
    
    Args:
        filepath: Путь к файлу с User-Agent (по одному на строку)
        
    Returns:
        Список User-Agent строк
    """
    try:
        with open(filepath, 'r') as f:
            agents = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        
        logger.info(f"Loaded {len(agents)} user agents from {filepath}")
        return agents
        
    except Exception as e:
        logger.warning(f"Failed to load user agents from {filepath}: {e}")
        # Fallback к дефолтному
        return [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]


def get_random_user_agent(user_agents: List[str]) -> str:
    """
    Возвращает случайный User-Agent
    """
    return random.choice(user_agents)


# ========================================
# Helper Functions
# ========================================

def clean_text(text: Optional[str]) -> str:
    """
    Очищает текст от лишних пробелов и спецсимволов
    """
    if not text:
        return ""
    
    # Удаляем множественные пробелы/переносы
    text = re.sub(r'\s+', ' ', text)
    
    # Удаляем пробелы в начале/конце
    text = text.strip()
    
    return text


def parse_price(price_text: Optional[str]) -> Optional[float]:
    """
    Извлекает цену из текста
    
    Args:
        price_text: Текст с ценой (например, "1 299 zł")
        
    Returns:
        Число или None
    """
    if not price_text:
        return None
    
    # Удаляем все кроме цифр и точки/запятой
    price_str = re.sub(r'[^\d,.]', '', price_text)
    
    # Заменяем запятую на точку
    price_str = price_str.replace(',', '.')
    
    try:
        return float(price_str)
    except:
        return None


def extract_id_from_url(url: str) -> Optional[str]:
    """
    Извлекает ID объявления из URL
    
    Args:
        url: URL объявления OLX
        
    Returns:
        ID или None
    """
    # Ищем паттерн IDxxxxxx
    match = re.search(r'ID([a-zA-Z0-9]+)', url)
    if match:
        return match.group(1)
    
    return None


def sanitize_filename(filename: str) -> str:
    """
    Делает имя файла безопасным
    """
    # Удаляем небезопасные символы
    filename = re.sub(r'[^\w\s-]', '', filename)
    filename = re.sub(r'[-\s]+', '-', filename)
    
    return filename[:100]  # Ограничиваем длину


# ========================================
# CAPTCHA Detection
# ========================================

def is_captcha_present(page_content: str) -> bool:
    """
    Определяет наличие CAPTCHA на странице
    
    Args:
        page_content: HTML контент страницы
        
    Returns:
        True если CAPTCHA обнаружена
    """
    # Паттерны CAPTCHA
    captcha_patterns = [
        r'captcha',
        r'recaptcha',
        r'hcaptcha',
        r'robot\s+check',
        r'verify\s+you.*human',
        r'security\s+check'
    ]
    
    content_lower = page_content.lower()
    
    for pattern in captcha_patterns:
        if re.search(pattern, content_lower):
            logger.warning(f"CAPTCHA pattern detected: {pattern}")
            return True
    
    return False


# ========================================
# Configuration Loader
# ========================================

def load_config() -> Dict[str, Any]:
    """
    Загружает конфигурацию из .env
    
    Returns:
        Словарь с настройками
    """
    from dotenv import load_dotenv
    load_dotenv()
    
    config = {
        # OLX
        'search_queries': os.getenv('SEARCH_QUERIES', '').split(','),
        'max_ads': int(os.getenv('MAX_ADS', '10')),
        'rate_limit': int(os.getenv('RATE_LIMIT_PER_MINUTE', '10')),
        
        # Playwright
        'headless': os.getenv('PLAYWRIGHT_HEADLESS', 'true').lower() == 'true',
        'browser_type': os.getenv('BROWSER_TYPE', 'chromium'),
        'download_images': os.getenv('DOWNLOAD_IMAGES', 'true').lower() == 'true',
        'images_dir': os.getenv('IMAGES_DIR', './data/images'),
        'screenshot_on_error': os.getenv('SCREENSHOT_ON_ERROR', 'true').lower() == 'true',
        
        # Llama
        'llama_url': os.getenv('LLAMA_WEB_URL', ''),
        'llama_timeout': int(os.getenv('LLAMA_TIMEOUT', '60')),
        'llama_retries': int(os.getenv('LLAMA_MAX_RETRIES', '2')),
        
        # Webhook
        'webhook_url': os.getenv('WEBHOOK_URL', ''),
        'webhook_timeout': int(os.getenv('WEBHOOK_TIMEOUT', '30')),
        'webhook_retries': int(os.getenv('WEBHOOK_MAX_RETRIES', '3')),
        
        # Advanced
        'min_delay': float(os.getenv('MIN_DELAY', '0.8')),
        'max_delay': float(os.getenv('MAX_DELAY', '2.5')),
        'page_timeout': int(os.getenv('PAGE_TIMEOUT', '30')) * 1000,  # в миллисекундах
        'respect_robots': os.getenv('RESPECT_ROBOTS', 'true').lower() == 'true',
        'robots_url': os.getenv('ROBOTS_URL', 'https://www.olx.pl/robots.txt'),
        
        # Logging
        'log_level': os.getenv('LOG_LEVEL', 'INFO'),
        'log_file': os.getenv('LOG_FILE', './data/logs/scraper.log'),
        'log_console': os.getenv('LOG_TO_CONSOLE', 'true').lower() == 'true',
        
        # User Agents
        'user_agents_file': os.getenv('USER_AGENT_LIST_PATH', './user_agents.txt'),
        'rotate_ua': os.getenv('ROTATE_USER_AGENTS', 'true').lower() == 'true',
        
        # Proxy
        'proxy': os.getenv('PROXY', None),
        
        # CAPTCHA
        'captcha_dir': os.getenv('CAPTCHA_SCREENSHOT_DIR', './data/captcha_screenshots'),
        'manual_review_file': os.getenv('MANUAL_REVIEW_FILE', './manual_review.json'),
    }
    
    # Валидация обязательных полей
    required = ['webhook_url', 'llama_url']
    missing = [k for k in required if not config.get(k)]
    
    if missing:
        logger.error(f"Missing required config: {', '.join(missing)}")
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    return config
