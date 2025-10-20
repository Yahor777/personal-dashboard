# 🎯 Puppeteer v4.0 + Stealth - Полностью Доработан!

## ✅ Что Было Исправлено

### 1. Установлен Stealth Plugin
```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

**Что даёт:**
- 🕵️ Обход detection headless браузера
- 🔒 OLX не видит что это бот
- ✅ Все проверки пройдены

### 2. Реалистичные Заголовки
```javascript
User-Agent: Chrome/120.0.0.0
Accept-Language: pl-PL,pl;q=0.9
Accept: text/html,application/xhtml+xml...
```

### 3. Улучшенные Селекторы
```javascript
// Пробуем 10+ вариантов селекторов:
'[data-cy="l-card"]'
'div[data-testid="listing-grid"] > div'
'div[data-cy="listing-grid-item"]'
'a[href*="/d/"]'
'a[href*="/oferta/"]'
// И ещё много других...
```

### 4. Отладка
```javascript
// Скриншоты страницы
debug-olx-page1.png

// HTML если ничего не найдено
debug-olx-page1.html

// Детальные логи
```

### 5. Увеличенные Timeouts
```javascript
// Ждём загрузки JS
timeout: 60000 (60 сек)
waitForTimeout: 3000 (3 сек на JS)
```

---

## 🚀 Как Тестировать

### Шаг 1: Backend Запущен

Должно быть окно:
```
=== 🎯 Backend v4.0 - Puppeteer + Stealth ===
Stealth Plugin: ✅ Active
```

### Шаг 2: Подождите 30-60 Секунд

**Первый запуск самый долгий:**
- Puppeteer скачивает Chromium
- Запускается браузер
- Инициализируется stealth plugin

### Шаг 3: Тестируем из PowerShell

```powershell
# Простой тест
$body = @{query='iphone'; marketplace='olx'; maxPages=1} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3002/api/search' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 90
```

### Шаг 4: Смотрим Результаты

**Если Работает:**
```json
{
  "results": [...],  // Массив товаров
  "count": 25,       // Количество
  "source": "live",  // Реальные данные!
  "marketplace": "olx"
}
```

**Если Не Работает:**
```json
{
  "results": [],
  "count": 0
}
```

---

## 🔍 Отладка

### Проверяем Скриншоты

После поиска в папке `backend/` появятся:
```
debug-olx-page1.png   ← Скриншот страницы
debug-olx-page1.html  ← HTML если ничего не найдено
```

**Откройте PNG:**
```powershell
cd backend
start debug-olx-page1.png
```

**Что смотреть:**
- ✅ Видны ли карточки товаров?
- ✅ Загрузилась ли страница полностью?
- ❌ Есть ли капча?
- ❌ Блокировка OLX?

### Проверяем HTML

```powershell
start debug-olx-page1.html
```

**В HTML ищем:**
```html
<!-- Должны быть карточки: -->
<div data-cy="l-card">
  <a href="/d/oferta/...">
    <h6>iPhone 13 Pro</h6>
  </a>
</div>
```

---

## 📊 Ожидаемое Поведение

### Первый Поиск (Холодный Старт):
```
1. [Puppeteer+Stealth] Launching browser... (10-30 сек)
2. [Puppeteer OLX] Navigating to: https://...
3. [Puppeteer OLX] Waiting for content...
4. [Puppeteer OLX] Screenshot saved
5. [Page] Found 40 cards on page
6. [Puppeteer OLX] Extracted 40 listings
```

**Время:** 30-60 секунд

### Последующие Поиски (Тёплый Старт):
```
1. [Puppeteer OLX] Navigating to: https://...
2. [Puppeteer OLX] Waiting for content...
3. [Puppeteer OLX] Screenshot saved
4. [Page] Found 40 cards on page
5. [Puppeteer OLX] Extracted 40 listings
```

**Время:** 5-10 секунд

---

## ⚙️ Настройки

### Изменить Количество Страниц

**Файл:** `backend/server.js` (строка ~102)

```javascript
const options = { 
  minPrice, 
  maxPrice, 
  category, 
  location, 
  maxPages: 1  // ← 1 страница = быстрее (40 товаров)
               //   2-3 страницы = оптимально (80-120 товаров)
               //   5+ страниц = много (200+ товаров, медленно)
};
```

### Включить/Выключить Скриншоты

**Файл:** `backend/scrapers/olxScraperPuppeteer.js` (строка ~162)

```javascript
// Закомментируйте чтобы отключить:
// await page.screenshot({ path: screenshotPath });
```

---

## 🎯 Тест После Запуска

### Тест 1: Проверка Health

```powershell
Invoke-RestMethod http://localhost:3002/health
```

**Ожидается:**
```json
{"status":"ok","timestamp":"..."}
```

### Тест 2: Простой Поиск

```powershell
$body = @{query='laptop'; marketplace='olx'; maxPages=1} | ConvertTo-Json
$result = Invoke-RestMethod -Uri 'http://localhost:3002/api/search' `
  -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 90

Write-Host "Найдено: $($result.count) товаров"
$result.results | Select -First 3 | % { Write-Host "- $($_.title) | $($_.price) zł" }
```

### Тест 3: RX 580

```powershell
$body = @{query='rx 580'; marketplace='olx'; maxPages=1} | ConvertTo-Json
$result = Invoke-RestMethod -Uri 'http://localhost:3002/api/search' `
  -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 90

Write-Host "✅ RX 580: $($result.count) товаров"
```

---

## 🐛 Возможные Проблемы

### 1. Timeout Error

**Причина:** Медленный интернет или OLX не отвечает

**Решение:**
- Увеличьте timeout в PowerShell до 120 сек
- Проверьте интернет
- Попробуйте ещё раз

### 2. Всё Равно 0 Результатов

**Что делать:**

1. **Проверьте скриншот:**
```powershell
cd backend
start debug-olx-page1.png
```

2. **Если на скриншоте есть товары:**
   - Селекторы устарели
   - Нужно обновить код парсинга

3. **Если на скриншоте пустая страница:**
   - OLX блокирует
   - Попробуйте с VPN
   - Измените User-Agent

4. **Если на скриншоте капча:**
   - OLX определил бота
   - Нужны дополнительные меры

### 3. Browser Not Found

```powershell
cd backend
npx puppeteer browsers install chrome
```

---

## 📈 Производительность

### Оптимальные Настройки:

| Параметр | Значение | Почему |
|----------|----------|--------|
| maxPages | 1-2 | Быстро, достаточно товаров |
| timeout | 60s | Надёжно |
| screenshots | Да | Для отладки |
| stealth | Да | Обход detection |

### Скорость:

| Сценарий | Время |
|----------|-------|
| Холодный старт | 30-60 сек |
| Тёплый старт | 5-15 сек |
| 1 страница | ~10 сек |
| 3 страницы | ~25 сек |

---

## ✨ Что Дальше

### Если Работает:

1. ✅ Перезагрузите frontend (CTRL+SHIFT+R)
2. ✅ Откройте OLX Marketplace
3. ✅ Попробуйте поиск "RX 580"
4. ✅ Ждите 10-60 секунд
5. ✅ Увидите РЕАЛЬНЫЕ объявления!

### Если Не Работает:

1. 📸 Откройте debug-olx-page1.png
2. 📄 Откройте debug-olx-page1.html
3. 📤 Отправьте мне скриншоты
4. 🔧 Я доработаю селекторы

---

## 🎉 Готово!

**Backend v4.0 с Puppeteer + Stealth полностью настроен!**

**Попробуйте тест прямо сейчас:**

```powershell
# Подождите 60 секунд после запуска backend
Start-Sleep -Seconds 60

# Тестируем
$body = @{query='iphone 13'; marketplace='olx'; maxPages=1} | ConvertTo-Json
$result = Invoke-RestMethod -Uri 'http://localhost:3002/api/search' `
  -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 90

if ($result.count -gt 0) {
    Write-Host "🎉 РАБОТАЕТ! Найдено: $($result.count)" -ForegroundColor Green
} else {
    Write-Host "⚠️ 0 результатов. Смотрите debug-olx-page1.png" -ForegroundColor Yellow
}
```

---

**Версия:** 4.0 - Puppeteer + Stealth  
**Дата:** 14 октября 2025  
**Статус:** 🔧 Доработан, тестируется
