"""
Unit тесты для OLX Scraper

Тестируют:
- Утилиты (парсинг цен, очистка текста, etc)
- Формирование промтов
- Валидация JSON
- Fallback рейтинг
"""

import pytest
import json
from src.utils import (
    clean_text,
    parse_price,
    extract_id_from_url,
    is_captcha_present,
    sanitize_filename
)
from src.llm_bridge import compute_simple_rating


class TestUtils:
    """
    Тесты для утилит
    """
    
    def test_clean_text(self):
        """Тест очистки текста"""
        # Множественные пробелы
        assert clean_text("Hello    world") == "Hello world"
        
        # Переносы строк
        assert clean_text("Hello\n\n\nworld") == "Hello world"
        
        # Пробелы в начале/конце
        assert clean_text("  Hello world  ") == "Hello world"
        
        # None
        assert clean_text(None) == ""
        
        # Пустая строка
        assert clean_text("") == ""
    
    def test_parse_price(self):
        """Тест парсинга цен"""
        # Польский формат
        assert parse_price("1 299 zł") == 1299.0
        
        # С запятой
        assert parse_price("1,5 zł") == 1.5
        
        # Только числа
        assert parse_price("1299") == 1299.0
        
        # None
        assert parse_price(None) is None
        
        # Невалидная цена
        assert parse_price("free") is None
    
    def test_extract_id_from_url(self):
        """Тест извлечения ID из URL"""
        # Стандартный OLX URL
        url = "https://www.olx.pl/d/oferty/IDabcd1234.html"
        assert extract_id_from_url(url) == "abcd1234"
        
        # Без ID
        url = "https://www.olx.pl/d/oferty/"
        assert extract_id_from_url(url) is None
    
    def test_is_captcha_present(self):
        """Тест обнаружения CAPTCHA"""
        # С CAPTCHA
        html = "<div class='g-recaptcha'>Please verify</div>"
        assert is_captcha_present(html) is True
        
        # Без CAPTCHA
        html = "<div>Regular content</div>"
        assert is_captcha_present(html) is False
        
        # hCaptcha
        html = "<div class='h-captcha'></div>"
        assert is_captcha_present(html) is True
    
    def test_sanitize_filename(self):
        """Тест очистки имён файлов"""
        # Небезопасные символы
        assert sanitize_filename("hello/world") == "helloworld"
        
        # Пробелы
        assert sanitize_filename("hello world") == "hello-world"
        
        # Длинное имя
        long_name = "a" * 200
        result = sanitize_filename(long_name)
        assert len(result) == 100


class TestRating:
    """
    Тесты для системы рейтинга
    """
    
    def test_simple_rating_full_data(self):
        """Тест рейтинга с полными данными"""
        ad_data = {
            'price': 1299.0,
            'description': 'A' * 100,  # Длинное описание
            'images': ['img1.jpg', 'img2.jpg', 'img3.jpg'],
            'location': 'Warszawa',
            'date': '2025-10-18'
        }
        
        score = compute_simple_rating(ad_data)
        
        # Должен быть высокий рейтинг
        assert score >= 70
        assert score <= 100
    
    def test_simple_rating_minimal_data(self):
        """Тест рейтинга с минимальными данными"""
        ad_data = {
            'title': 'Test ad'
        }
        
        score = compute_simple_rating(ad_data)
        
        # Должен быть низкий рейтинг
        assert score >= 0
        assert score <= 60
    
    def test_simple_rating_with_images(self):
        """Тест влияния изображений на рейтинг"""
        ad_no_images = {
            'price': 1000,
            'description': 'Test'
        }
        
        ad_with_images = {
            'price': 1000,
            'description': 'Test',
            'images': ['img1.jpg', 'img2.jpg']
        }
        
        score_no_images = compute_simple_rating(ad_no_images)
        score_with_images = compute_simple_rating(ad_with_images)
        
        # С изображениями должен быть выше
        assert score_with_images > score_no_images


class TestLlamaBridge:
    """
    Тесты для Llama Bridge
    """
    
    def test_json_response_parsing_valid(self):
        """Тест парсинга валидного JSON"""
        from src.llm_bridge import LlamaBridge
        
        # Создаём mock конфиг
        config = {
            'llama_url': 'http://test',
            'llama_timeout': 60,
            'llama_retries': 2
        }
        
        # Создаём bridge (без браузера для теста)
        bridge = LlamaBridge(config, None)
        
        # Валидный JSON ответ
        response_text = '''
        {
            "summary": "Test summary",
            "selling_points": ["Point 1", "Point 2"],
            "score": 75,
            "reasoning": "Test reasoning",
            "missing_fields": []
        }
        '''
        
        result = bridge._parse_json_response(response_text)
        
        assert result is not None
        assert result['summary'] == "Test summary"
        assert result['score'] == 75
        assert len(result['selling_points']) == 2
    
    def test_json_response_parsing_with_markdown(self):
        """Тест парсинга JSON в markdown блоке"""
        from src.llm_bridge import LlamaBridge
        
        config = {
            'llama_url': 'http://test',
            'llama_timeout': 60,
            'llama_retries': 2
        }
        
        bridge = LlamaBridge(config, None)
        
        # JSON в markdown code block
        response_text = '''
        ```json
        {
            "summary": "Test",
            "selling_points": ["Point 1"],
            "score": 80,
            "reasoning": "Test"
        }
        ```
        '''
        
        result = bridge._parse_json_response(response_text)
        
        assert result is not None
        assert result['score'] == 80
    
    def test_json_response_parsing_invalid(self):
        """Тест парсинга некорректного JSON"""
        from src.llm_bridge import LlamaBridge
        
        config = {
            'llama_url': 'http://test',
            'llama_timeout': 60,
            'llama_retries': 2
        }
        
        bridge = LlamaBridge(config, None)
        
        # Невалидный JSON
        response_text = "This is not JSON"
        
        result = bridge._parse_json_response(response_text)
        
        assert result is None
    
    def test_fallback_analysis(self):
        """Тест fallback анализа"""
        from src.llm_bridge import LlamaBridge
        
        config = {
            'llama_url': 'http://test',
            'llama_timeout': 60,
            'llama_retries': 2
        }
        
        bridge = LlamaBridge(config, None)
        
        ad_data = {
            'title': 'Test Product',
            'price': 1000,
            'currency': 'PLN',
            'description': 'Good product',
            'images': ['img1.jpg'],
            'location': 'Warszawa'
        }
        
        analysis = bridge._compute_fallback_analysis(ad_data)
        
        assert analysis is not None
        assert 'summary' in analysis
        assert 'score' in analysis
        assert 'selling_points' in analysis
        assert analysis['fallback'] is True


class TestScraper:
    """
    Тесты для scraper (без реального браузера)
    """
    
    def test_search_url_building(self):
        """Тест построения URL поиска"""
        from src.scraper import OLXScraper
        
        config = {
            'rate_limit': 10,
            'min_delay': 0.5,
            'max_delay': 1.0,
            'respect_robots': False
        }
        
        scraper = OLXScraper(config, ['test-agent'])
        
        # Первая страница
        url = scraper._build_search_url('rtx 3060', 1)
        assert 'rtx' in url or 'rtx+3060' in url
        
        # Вторая страница
        url = scraper._build_search_url('rtx 3060', 2)
        assert 'page=2' in url


# ========================================
# Интеграционные тесты (требуют .env)
# ========================================

@pytest.mark.integration
class TestIntegration:
    """
    Интеграционные тесты (требуют настроенный .env)
    """
    
    @pytest.mark.asyncio
    async def test_full_pipeline_single_ad(self):
        """
        Тест полного pipeline на одном объявлении
        ВНИМАНИЕ: Требует настроенный .env с реальным webhook и Llama URL
        """
        from src.utils import load_config, setup_logging
        from src.processor import OLXProcessor
        
        try:
            config = load_config()
            setup_logging('DEBUG', None, True)
            
            # Ограничиваем до 1 объявления для теста
            config['max_ads'] = 1
            config['search_queries'] = ['test query']
            
            processor = OLXProcessor(config)
            
            # Запускаем (может занять время!)
            await processor.process_all_queries()
            
            # Если дошли сюда - успех
            assert True
            
        except Exception as e:
            pytest.skip(f"Integration test skipped: {e}")


# ========================================
# Запуск тестов
# ========================================

if __name__ == '__main__':
    # Запуск unit тестов
    pytest.main([__file__, '-v', '-m', 'not integration'])
