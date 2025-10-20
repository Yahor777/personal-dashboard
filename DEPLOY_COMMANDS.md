# 🚀 Команды для деплоя Backend Scraper

## 📦 Что было сделано

✅ **Backend scraper** для OLX, Ceneo, x-kom (папка `/backend/`)  
✅ **Frontend integration** - реальный API вместо mock данных  
✅ **Локально протестировано** - backend и frontend работают  
✅ **Документация** - README, CHANGELOG, примеры  

---

## 🔧 Команды для Git

### 1. Проверить статус
```powershell
cd "d:\проекты\Personal Dashboard App"
git status
```

### 2. Добавить все файлы
```powershell
git add .
```

### 3. Закоммитить изменения
```powershell
git commit -m "feat: реализован backend scraper для реального поиска по OLX, Ceneo, x-kom

- Создан Express backend с scrapers для 3 маркетплейсов
- Добавлены cache (5 min TTL) и rate limiting (10 req/min)
- Обновлен OLXSearchPanel.tsx для использования реального API
- Удалены mock данные
- Добавлена полная документация (backend/README.md)
- Тестировано локально - backend работает на localhost:3002

Closes #OLX-Backend-Integration"
```

### 4. Запушить на GitHub
```powershell
git push origin main
```

---

## 🌐 GitHub Pages (Frontend деплой)

Frontend автоматически задеплоится через **GitHub Actions** (~2-3 минуты).

**URL:** https://yahor777.github.io/personal-dashboard

**Проверка:**
1. Дождитесь завершения Actions (зелёная галочка)
2. Откройте URL
3. Нажмите Ctrl+F5 для очистки кэша

**⚠️ Внимание:**  
Backend НЕ будет работать на GitHub Pages (нужен отдельный хостинг).

---

## 🚀 Backend деплой (опционально)

### Вариант 1: Render.com (БЕСПЛАТНО, рекомендуется)

**Шаги:**
1. Зарегистрируйтесь на https://render.com
2. Создайте **Web Service**
3. Подключите ваш GitHub репозиторий
4. Настройки:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Port:** 3002 (автоопределится)
5. Environment Variables:
   ```
   NODE_ENV=production
   ALLOWED_ORIGINS=https://yahor777.github.io,http://localhost:5173
   MAX_REQUESTS_PER_MINUTE=10
   CACHE_TTL=300
   ```
6. Нажмите **Deploy**

**Готово!** Backend будет доступен на `https://your-app.onrender.com`

**Обновить Frontend:**
```powershell
# Обновите .env.local:
echo "VITE_BACKEND_URL=https://your-app.onrender.com" > .env.local

# Rebuild и push:
npm run build
git add .
git commit -m "chore: обновлен BACKEND_URL для production"
git push origin main
```

---

### Вариант 2: Railway.app (Платно $5/мес)

```powershell
# Установите Railway CLI:
npm i -g @railway/cli

# Войдите:
railway login

# Деплой:
cd backend
railway init
railway up
```

---

### Вариант 3: Heroku (Платно ~$7/мес)

```powershell
# Установите Heroku CLI:
# https://devcenter.heroku.com/articles/heroku-cli

# Войдите:
heroku login

# Создайте app:
heroku create your-dashboard-backend

# Настройте:
heroku config:set NODE_ENV=production
heroku config:set ALLOWED_ORIGINS=https://yahor777.github.io

# Деплой:
cd backend
git init
git add .
git commit -m "Initial backend"
git push heroku main
```

---

### Вариант 4: VPS (Полный контроль)

**Подойдёт:** DigitalOcean, Linode, Hetzner

**Шаги:**
1. Создайте Ubuntu VPS
2. Установите Node.js 18+
3. Клонируйте репозиторий
4. Настройте PM2:
```bash
npm install -g pm2
cd backend
npm install
pm2 start server.js --name olx-backend
pm2 save
pm2 startup
```
5. Настройте Nginx reverse proxy
6. Добавьте SSL (Let's Encrypt)

---

## 🧪 Локальное тестирование (если backend выключен)

### Запустить backend:
```powershell
cd "d:\проекты\Personal Dashboard App\backend"
npm start
```

### Запустить frontend:
```powershell
cd "d:\проекты\Personal Dashboard App"
npm run dev
```

### Проверить backend:
```powershell
curl http://localhost:3002/health
```

**Ожидаемый результат:**
```json
{"status":"ok","timestamp":"...","cache":{"total":0,"valid":0,"expired":0}}
```

### Тест search:
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3002/api/search" `
  -ContentType "application/json" `
  -Body '{"query":"RTX 3060","marketplace":"olx"}'
```

---

## 📋 Checklist перед деплоем

**Backend:**
- [x] `npm install` выполнен
- [x] `.env` создан из `.env.example`
- [x] `npm start` работает локально
- [x] Health check отвечает HTTP 200
- [x] Search endpoint возвращает данные

**Frontend:**
- [x] `.env.local` создан
- [x] `VITE_BACKEND_URL` настроен
- [x] `npm run dev` работает
- [x] OLX Search Panel открывается (Ctrl+K)
- [x] Поиск работает (с запущенным backend)

**Git:**
- [x] Все файлы добавлены (`git add .`)
- [x] Коммит создан с понятным message
- [x] Push на GitHub выполнен

**GitHub Actions:**
- [ ] Build прошёл успешно (зелёная галочка)
- [ ] GitHub Pages обновился

**Backend Hosting (если нужен):**
- [ ] Зарегистрировались на Render/Railway/Heroku
- [ ] Backend задеплоен
- [ ] Environment variables настроены
- [ ] Frontend обновлён с production BACKEND_URL

---

## 🆘 Troubleshooting

### Git push rejected?
```powershell
# Pull latest changes first:
git pull origin main --rebase
git push origin main
```

### GitHub Actions failed?
1. Откройте GitHub → Actions
2. Посмотрите логи ошибок
3. Обычно проблемы с build - проверьте `npm run build` локально

### Backend на Render не работает?
1. Проверьте логи на Render dashboard
2. Убедитесь, что Root Directory = `backend`
3. Проверьте Environment Variables
4. Убедитесь, что Start Command = `npm start`

### Frontend не подключается к backend?
1. Проверьте `VITE_BACKEND_URL` в `.env.local`
2. Проверьте CORS в backend `.env` (ALLOWED_ORIGINS)
3. Откройте DevTools (F12) → Console для ошибок

---

## 📞 Поддержка

Если что-то не работает:
1. Проверьте логи в консоли (F12)
2. Проверьте Network tab (F12 → Network)
3. Создайте issue на GitHub с:
   - Скриншотом ошибки
   - Шагами для воспроизведения
   - Версией Node.js (`node --version`)

---

## 🎉 Готово!

После выполнения команд:
- ✅ Backend код будет на GitHub
- ✅ Frontend автоматически обновится на GitHub Pages
- ✅ (Опционально) Backend будет на Render/Railway/Heroku

**URL приложения:** https://yahor777.github.io/personal-dashboard  
**Backend (локально):** http://localhost:3002  
**Backend (Render):** https://your-app.onrender.com  

---

**Удачи! 🚀**
