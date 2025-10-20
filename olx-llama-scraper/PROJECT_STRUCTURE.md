# 📁 Структура Проекта

## Список Всех Файлов

```
olx-llama-scraper/
│
├── 📄 README.md                           # Главная инструкция
├── 📄 requirements.txt                    # Python зависимости
├── 📄 .env.example                        # Пример переменных окружения
├── 📄 .gitignore                          # Git игнор файл
├── 📄 Dockerfile                          # Docker образ
├── 📄 docker-compose.yml                  # Docker Compose конфигурация
├── 📄 user_agents.txt                     # Список User-Agent строк
├── 📄 manual_review.json.example          # Пример очереди CAPTCHA
├── 📄 olx-scraper.service.example         # Systemd service (Linux)
├── 📄 PROJECT_STRUCTURE.md                # Этот файл
│
├── 📂 src/                                # Исходный код
│   ├── __init__.py                        # Package init
│   ├── scraper.py                         # Playwright OLX scraper
│   ├── llm_bridge.py                      # Llama 4 интеграция
│   ├── processor.py                       # Главный процессор
│   └── utils.py                           # Утилиты и helpers
│
├── 📂 tests/                              # Тесты
│   ├── __init__.py
│   └── test_basic.py                      # Unit тесты
│
└── 📂 data/                               # Данные (создаётся автоматически)
    ├── images/                            # Скачанные изображения
    ├── logs/                              # Логи
    ├── captcha_screenshots/               # Скриншоты CAPTCHA
    ├── error_screenshots/                 # Скриншоты ошибок
    └── failed_webhooks/                   # Failed webhook payloads
```

---

## ⚠️ Что Может Пойти Не Так

### 1. CAPTCHA Появляется Часто

**Симптомы:**
- Логи показывают `CAPTCHA detected`
- `manual_review.json` заполняется
- Мало объявлений собирается

**Причины:**
- Слишком высокая частота запросов
- IP адрес заблокирован OLX
- User-Agent выглядит подозрительно

**Решения:**
```bash
# 1. Увеличьте задержки в .env
MIN_DELAY=2.0
MAX_DELAY=5.0
RATE_LIMIT_PER_MINUTE=5

# 2. Используйте прокси
PROXY=http://your-proxy:8080

# 3. Rotate User-Agents
ROTATE_USER_AGENTS=true

# 4. Запускайте реже
# Вместо каждый час - каждые 6 часов

# 5. Ручная обработка CAPTCHA
PLAYWRIGHT_HEADLESS=false
python -m src.processor
# Решите CAPTCHA вручную в открывшемся браузере
```

---

### 2. OLX Изменил Структуру Страницы

**Симптомы:**
- Логи: `No listing cards found`
- Скриншоты показывают страницу но нет данных
- 0 результатов от scraper

**Причины:**
- OLX обновил HTML селекторы
- Изменилась структура DOM

**Решения:**
```bash
# 1. Запустите в headful режиме для отладки
PLAYWRIGHT_HEADLESS=false
python -m src.processor

# 2. Проверьте скриншоты
ls data/error_screenshots/

# 3. Обновите селекторы в src/scraper.py
# Найдите новые data-cy, data-testid атрибуты
# через DevTools браузера

# 4. Посмотрите актуальную страницу OLX
# и сравните с кодом в _extract_ad_data()
```

**Где обновлять:**
- `src/scraper.py` → методы `_scrape_search_page()` и `_extract_ad_data()`
- Ищите селекторы типа: `[data-cy="l-card"]`, `[data-testid="ad-price"]`

---

### 3. Llama 4 Возвращает Некорректный JSON

**Симптомы:**
- Логи: `Invalid JSON from Llama`
- Используется fallback рейтинг
- AI анализ выглядит базовым

**Причины:**
- Llama возвращает текст вместе с JSON
- Промт недостаточно строгий
- Web UI изменился

**Решения:**
```bash
# 1. Проверьте промт в src/llm_bridge.py
# Убедитесь что он требует ТОЛЬКО JSON

# 2. Обновите селекторы для Llama web UI
# в методе _query_llama()

# 3. Тестируйте вручную
python -m src.llm_bridge

# 4. Увеличьте retries
LLAMA_MAX_RETRIES=3

# 5. Проверьте логи Llama
# Система автоматически retry с исправлением
```

---

### 4. Webhook Недоступен

**Симптомы:**
- Логи: `Webhook timeout` или `Webhook request error`
- Данные сохраняются в `data/failed_webhooks/`

**Причины:**
- Webhook endpoint не отвечает
- Сеть недоступна
- Таймаут слишком короткий

**Решения:**
```bash
# 1. Проверьте webhook вручную
curl -X POST https://your-site.com/api/listings \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# 2. Увеличьте таймауты
WEBHOOK_TIMEOUT=60
WEBHOOK_MAX_RETRIES=5

# 3. Повторно отправьте failed payloads
# Они сохраняются в data/failed_webhooks/*.json
# Можно написать скрипт для retry
```

---

### 5. Playwright Не Может Найти Браузер

**Симптомы:**
- Ошибка: `Executable doesn't exist`
- Браузер не запускается

**Решения:**
```bash
# Установите браузеры Playwright
playwright install chromium

# Или все браузеры
playwright install

# Проверьте установку
playwright --version

# Для Docker - пересоберите образ
docker-compose build --no-cache
```

---

### 6. Блокировка IP Адреса

**Симптомы:**
- Постоянные CAPTCHA
- HTTP 403 ошибки
- Страницы не загружаются

**Решения:**
```bash
# 1. Смените IP (используйте прокси)
PROXY=http://username:password@proxy.com:8080

# 2. Уменьшите rate limiting
RATE_LIMIT_PER_MINUTE=3
MAX_ADS=5

# 3. Увеличьте задержки
MIN_DELAY=3.0
MAX_DELAY=8.0

# 4. Запускайте реже
# Cron: раз в 12 часов вместо каждый час

# 5. Подождите 24-48 часов
# Блокировки OLX обычно временные
```

---

### 7. Out of Memory (OOM)

**Симптомы:**
- Процесс падает без ошибок
- Docker контейнер перезапускается
- Система зависает

**Причины:**
- Слишком много объявлений сразу
- Скачивание больших изображений
- Утечки памяти в Playwright

**Решения:**
```bash
# 1. Уменьшите MAX_ADS
MAX_ADS=5

# 2. Отключите скачивание изображений
DOWNLOAD_IMAGES=false

# 3. Увеличьте память для Docker
# В docker-compose.yml:
memory: 4G

# 4. Запускайте по одному запросу
SEARCH_QUERIES=rtx 3060
# Вместо: rtx 3060,iphone 13,laptop

# 5. Перезапускайте scraper периодически
# Systemd: Restart=always
```

---

### 8. Проблемы с Правами Доступа (Linux)

**Симптомы:**
- Ошибки записи в `data/`
- Permission denied

**Решения:**
```bash
# Дайте права на папки
chmod -R 755 data/
chown -R your-user:your-user data/

# Для Docker - используйте volumes
# См. docker-compose.yml
```

---

## 🔧 Рекомендации по Улучшению

### Краткосрочные (1-2 недели):

1. **Добавить MongoDB/PostgreSQL**
   - Хранить историю объявлений
   - Отслеживать изменения цен
   - Анализ трендов

2. **Telegram Bot для Уведомлений**
   ```python
   # При обнаружении CAPTCHA
   send_telegram_message(
       "⚠️ CAPTCHA detected, manual review needed"
   )
   ```

3. **Dashboard для Визуализации**
   - Streamlit или Gradio
   - График цен
   - Статистика по запросам

4. **Улучшенный Retry Queue**
   - Celery для асинхронных задач
   - Redis для очереди
   - Exponential backoff

### Среднесрочные (1-2 месяца):

1. **Переход на OLX API**
   - Если получите доступ к Partner API
   - Полностью легально
   - Нет проблем с CAPTCHA

2. **Distributed Scraping**
   - Несколько worker'ов
   - Load balancing
   - Shared Redis кэш

3. **ML Модель для Рейтинга**
   - Обучить на исторических данных
   - Предсказание "хороших" сделок
   - Кастомная модель вместо Llama (опционально)

4. **Advanced Anti-Detection**
   - Браузерные fingerprints
   - Playwright Stealth
   - Residential proxies

### Долгосрочные (3+ месяца):

1. **Multi-Marketplace Support**
   - Allegro.pl
   - Vinted.pl
   - Facebook Marketplace

2. **Price Tracking & Alerts**
   - Отслеживание изменений цен
   - Email/SMS уведомления
   - Автоматическая покупка (с подтверждением)

3. **API для Вашего Сайта**
   - REST API
   - GraphQL
   - WebSocket real-time updates

4. **Mobile App**
   - React Native
   - Flutter
   - Push notifications

---

## 🛡️ Безопасность и Соблюдение Правил

### ✅ Обязательно:

1. **Уважайте robots.txt**
   ```bash
   RESPECT_ROBOTS=true
   ```

2. **Rate Limiting**
   - Не более 10 запросов в минуту
   - Задержки 1-3 секунды

3. **Не храните API ключи в коде**
   - Только в `.env`
   - Добавьте `.env` в `.gitignore`

4. **Логируйте ответственно**
   - Не логируйте пароли
   - Не логируйте API ключи
   - Ротация логов

### ❌ Никогда не делайте:

1. **Не обходите CAPTCHA программно**
   - Это нарушение ToS
   - Используйте manual review

2. **Не игнорируйте блокировки**
   - Если IP заблокирован - подождите
   - Не используйте тысячи прокси

3. **Не реселлите данные OLX**
   - Это может быть нелегально
   - Используйте для личных целей

4. **Не коммитьте конфиденциальные данные**
   - Проверяйте `.gitignore`
   - Используйте `git-secrets`

---

## 📞 Поддержка

Если возникли проблемы:

1. **Проверьте логи**
   ```bash
   tail -f data/logs/scraper.log
   ```

2. **Запустите в debug режиме**
   ```bash
   LOG_LEVEL=DEBUG
   PLAYWRIGHT_HEADLESS=false
   python -m src.processor
   ```

3. **Проверьте manual_review.json**
   ```bash
   cat manual_review.json | jq
   ```

4. **Запустите тесты**
   ```bash
   pytest tests/ -v
   ```

5. **Проверьте конфигурацию**
   ```bash
   python -c "from src.utils import load_config; print(load_config())"
   ```

---

**Удачи! 🚀**
