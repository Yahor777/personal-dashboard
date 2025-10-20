# 🚀 OLX Scraper + Llama 4 AI Integration

Автоматизированный помощник для поиска и анализа объявлений на OLX с использованием AI (Llama 4 Maverick).

---

## ⚠️ ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ

**Автоматизация может нарушать правила OLX. Используйте аккуратно, соблюдайте законы и правила сайта. Автор не несёт ответственности за блокировки.**

**РЕКОМЕНДАЦИЯ:** Лучше использовать официальный OLX Partner API, если доступен:
- https://www.olx.pl/partnerzy/
- https://developer.olx.pl/

---

## 📋 Что Делает Система

1. **Поиск объявлений** на OLX через Playwright (автоматизация браузера)
2. **Сбор данных**: URL, заголовок, цена, описание, изображения, дата, локация
3. **AI анализ** через Llama 4 Maverick (web UI):
   - Краткое резюме объявления
   - Ключевые преимущества (selling points)
   - Рейтинг 0-100
   - Пояснение оценки
4. **Отправка результатов** на ваш webhook
5. **Обработка CAPTCHA**: ручной режим при обнаружении
6. **Rate limiting**: уважение к серверам OLX

---

## 🛠️ Требования

- **Python 3.9+**
- **Playwright** (автоматически установит браузер)
- **Доступ к Llama 4 Maverick** (web UI)
- **Webhook endpoint** для получения результатов

---

## 📦 Установка

### Вариант 1: Нативная установка (Linux/macOS/Windows)

```bash
# 1. Клонируйте репозиторий
cd olx-llama-scraper

# 2. Создайте виртуальное окружение
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# 3. Установите зависимости
pip install -r requirements.txt

# 4. Установите браузеры для Playwright
playwright install chromium

# 5. Настройте .env
cp .env.example .env
nano .env  # Отредактируйте переменные
```

### Вариант 2: Docker

```bash
# 1. Настройте .env
cp .env.example .env
nano .env

# 2. Соберите и запустите
docker-compose up --build
```

---

## ⚙️ Настройка (.env)

Создайте файл `.env` на основе `.env.example`:

```bash
# === OLX Настройки ===
SEARCH_QUERIES=rtx 3060,iphone 13,gaming laptop
MAX_ADS=10
RATE_LIMIT_PER_MINUTE=10

# === Playwright Настройки ===
PLAYWRIGHT_HEADLESS=true
DOWNLOAD_IMAGES=true
IMAGES_DIR=./data/images

# === Llama 4 Web UI ===
LLAMA_WEB_URL=https://your-llama4-instance.com/chat
LLAMA_TIMEOUT=60

# === Webhook ===
WEBHOOK_URL=https://your-site.com/api/listings

# === Прокси (опционально) ===
# PROXY=http://user:pass@proxy.com:8080

# === User Agents ===
USER_AGENT_LIST_PATH=./user_agents.txt

# === Логирование ===
LOG_LEVEL=INFO
LOG_FILE=./logs/scraper.log
```

---

## 🚀 Запуск

### Ручной запуск

```bash
# Активируйте venv
source venv/bin/activate

# Запустите scraper
python -m src.processor
```

### Debug режим (с GUI браузера)

```bash
# В .env установите:
PLAYWRIGHT_HEADLESS=false

# Запустите
python -m src.processor
```

### Docker

```bash
docker-compose up
```

### Cron (автоматический запуск каждый час)

```bash
# Отредактируйте crontab
crontab -e

# Добавьте строку:
0 * * * * cd /path/to/olx-llama-scraper && /path/to/venv/bin/python -m src.processor >> /var/log/olx-scraper.log 2>&1
```

### Systemd Service (Linux)

Создайте `/etc/systemd/system/olx-scraper.service`:

```ini
[Unit]
Description=OLX Scraper Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/olx-llama-scraper
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/python -m src.processor
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable olx-scraper
sudo systemctl start olx-scraper
sudo systemctl status olx-scraper
```

---

## 📊 Формат Данных

### Что Отправляется на Webhook

```json
{
  "url": "https://www.olx.pl/d/oferta/...",
  "title": "MSI RTX 3060 Gaming X 12GB",
  "price": 1299.00,
  "currency": "PLN",
  "description": "Karta w idealnym stanie...",
  "images": [
    "https://ireland.apollo.olxcdn.com/...",
    "./data/images/abc123.jpg"
  ],
  "date": "2025-10-18",
  "location": "Warszawa",
  "ai_analysis": {
    "summary": "Używana karta graficzna w dobrym stanie",
    "selling_points": [
      "Dobra cena",
      "Sprawna karta",
      "Fast shipping"
    ],
    "score": 75,
    "reasoning": "Cena konkurencyjna, stan dobry",
    "missing_fields": []
  },
  "fallback_score": 72,
  "metadata": {
    "scraped_at": "2025-10-18T12:00:00Z",
    "source": "olx.pl",
    "search_query": "rtx 3060"
  }
}
```

---

## 🔍 Обработка CAPTCHA

Когда система обнаруживает CAPTCHA:

1. **Логирует событие**: `CAPTCHA detected on page: <URL>`
2. **Сохраняет в очередь**: `manual_review.json`
3. **Делает скриншот**: `./captcha_screenshots/<timestamp>.png`
4. **Останавливает обработку** этого объявления

### Ручная обработка:

```bash
# 1. Проверьте очередь
cat manual_review.json

# 2. Запустите в headful режиме
PLAYWRIGHT_HEADLESS=false python -m src.processor

# 3. Вручную решите CAPTCHA в открывшемся браузере

# 4. Очистите очередь
echo "[]" > manual_review.json
```

---

## 🧪 Тестирование

```bash
# Запустите тесты
pytest tests/

# С coverage
pytest --cov=src tests/
```

---

## 📁 Структура Проекта

```
olx-llama-scraper/
├── src/
│   ├── __init__.py
│   ├── scraper.py          # Playwright парсинг OLX
│   ├── llm_bridge.py       # Интеграция с Llama 4
│   ├── processor.py        # Главный процессор
│   └── utils.py            # Утилиты
├── tests/
│   ├── __init__.py
│   └── test_basic.py
├── data/
│   ├── images/             # Скачанные изображения
│   └── logs/               # Логи
├── .env.example
├── .env                    # Ваши настройки (НЕ коммитить!)
├── .gitignore
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── user_agents.txt         # Список User-Agent
├── manual_review.json      # Очередь CAPTCHA
└── README.md
```

---

## 🔒 Безопасность

### ✅ Делайте:

- Используйте `.env` для всех конфиденциальных данных
- Добавьте `.env` в `.gitignore`
- Используйте прокси для больших объёмов
- Соблюдайте rate limiting
- Уважайте `robots.txt`

### ❌ Не делайте:

- Не коммитьте `.env` в git
- Не логируйте API ключи
- Не обходите CAPTCHA программно
- Не игнорируйте блокировки

---

## 🐛 Что Может Пойти Не Так

### 1. CAPTCHA появляется часто

**Решение:**
- Увеличьте задержки между запросами
- Используйте прокси
- Rotate User-Agents
- Запускайте реже

### 2. OLX изменил структуру страницы

**Решение:**
- Обновите селекторы в `src/scraper.py`
- Запустите в headful режиме для отладки
- Проверьте логи

### 3. Llama 4 возвращает некорректный JSON

**Решение:**
- Система автоматически retry до 2 раз
- Проверьте промт в `src/llm_bridge.py`
- Используется fallback рейтинг

### 4. Блокировка IP

**Решение:**
- Настройте прокси в `.env`
- Уменьшите `RATE_LIMIT_PER_MINUTE`
- Увеличьте задержки

### 5. Playwright не может найти браузер

**Решение:**
```bash
playwright install chromium
```

---

## 📈 Рекомендации по Улучшению

### Краткосрочные:

1. **Добавить MongoDB** для хранения истории
2. **Telegram bot** для уведомлений о CAPTCHA
3. **Prometheus metrics** для мониторинга
4. **Retry queue** с exponential backoff

### Долгосрочные:

1. **Переход на OLX API** (если доступен)
2. **Distributed scraping** через Celery
3. **ML модель** для обнаружения "хороших" объявлений
4. **Dashboard** для визуализации результатов

---

## 📚 Документация

### Переменные Окружения

| Переменная | Описание | Обязательна | По умолчанию |
|-----------|----------|-------------|--------------|
| `SEARCH_QUERIES` | Поисковые запросы (через запятую) | ✅ | - |
| `MAX_ADS` | Максимум объявлений за запуск | ❌ | 10 |
| `WEBHOOK_URL` | URL для отправки результатов | ✅ | - |
| `PLAYWRIGHT_HEADLESS` | Headless режим браузера | ❌ | true |
| `LLAMA_WEB_URL` | URL Llama 4 web UI | ✅ | - |
| `RATE_LIMIT_PER_MINUTE` | Лимит запросов в минуту | ❌ | 10 |
| `DOWNLOAD_IMAGES` | Скачивать изображения | ❌ | true |
| `PROXY` | HTTP/HTTPS прокси | ❌ | - |
| `LOG_LEVEL` | Уровень логирования | ❌ | INFO |

### API Endpoints

Ваш webhook должен принимать POST запросы с JSON payload (см. "Формат Данных" выше).

Пример endpoint (Flask):

```python
@app.route('/api/listings', methods=['POST'])
def receive_listing():
    data = request.json
    # Обработка данных
    return {'status': 'ok'}, 200
```

---

## 🤝 Поддержка

Если возникли проблемы:

1. Проверьте логи: `./data/logs/scraper.log`
2. Запустите в debug режиме: `PLAYWRIGHT_HEADLESS=false`
3. Проверьте `manual_review.json` на CAPTCHA
4. Создайте issue в репозитории

---

## 📝 Лицензия

MIT License - используйте на свой страх и риск.

**Помните**: Соблюдайте законы и правила OLX!

---

## 🎯 Быстрый Старт (TL;DR)

```bash
# 1. Установка
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# 2. Настройка
cp .env.example .env
nano .env  # Заполните WEBHOOK_URL, LLAMA_WEB_URL, SEARCH_QUERIES

# 3. Запуск
python -m src.processor

# 4. Проверка результатов
tail -f data/logs/scraper.log
```

**Готово!** 🚀
