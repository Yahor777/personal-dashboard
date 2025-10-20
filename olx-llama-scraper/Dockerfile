# Dockerfile for OLX Scraper + Llama 4 Integration

FROM python:3.11-slim

# Устанавливаем системные зависимости для Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Создаём рабочую директорию
WORKDIR /app

# Копируем requirements
COPY requirements.txt .

# Устанавливаем Python зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Устанавливаем браузеры для Playwright
RUN playwright install chromium
RUN playwright install-deps chromium

# Копируем исходный код
COPY . .

# Создаём директории для данных
RUN mkdir -p /app/data/images \
    /app/data/logs \
    /app/data/captcha_screenshots \
    /app/data/failed_webhooks

# Создаём непривилегированного пользователя
RUN useradd -m -u 1000 scraper && \
    chown -R scraper:scraper /app

USER scraper

# Переменные окружения по умолчанию
ENV PLAYWRIGHT_HEADLESS=true
ENV LOG_LEVEL=INFO
ENV PYTHONUNBUFFERED=1

# Точка входа
CMD ["python", "-m", "src.processor"]
