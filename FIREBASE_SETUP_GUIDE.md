# 🔐 Настройка Google OAuth через Firebase

## ✅ Что уже сделано

- ✅ Firebase SDK установлен
- ✅ Google Sign-In кнопка добавлена в LoginRegisterModal
- ✅ Обработчик Google входа настроен в App.tsx
- ✅ Поддержка popup и redirect (для мобильных)
- ✅ Автоматическая загрузка workspace пользователя
- ✅ Проект собран успешно (1,573 kB)

---

## 🚀 Как настроить Firebase (5 минут)

### Шаг 1: Создайте Firebase проект

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Нажмите **"Add project"** (Добавить проект)
3. Введите название: **"Personal Dashboard"**
4. Отключите Google Analytics (не обязательно для этого проекта)
5. Нажмите **"Create project"**

---

### Шаг 2: Настройте Web App

1. В Firebase Console выберите ваш проект
2. Нажмите на иконку **Web** (`</>`) в разделе "Get started"
3. Введите App nickname: **"Personal Dashboard Web"**
4. ✅ Отметьте **"Also set up Firebase Hosting"** (по желанию)
5. Нажмите **"Register app"**

---

### Шаг 3: Скопируйте Firebase Config

Firebase покажет вам конфигурацию:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAbc123...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Скопируйте эти значения!** Они понадобятся на следующем шаге.

---

### Шаг 4: Создайте файл `.env.local`

В корне проекта создайте файл **`.env.local`**:

```bash
VITE_FIREBASE_API_KEY=AIzaSyAbc123...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**⚠️ ВАЖНО**: Замените значения на свои из шага 3!

---

### Шаг 5: Включите Google Sign-In

1. В Firebase Console перейдите в **Authentication** → **Sign-in method**
2. Нажмите на **Google** в списке провайдеров
3. Включите переключатель **"Enable"**
4. Выберите **Project support email** (ваш email)
5. Нажмите **"Save"**

---

### Шаг 6: Добавьте авторизованные домены

1. В разделе **Authentication** → **Settings** → **Authorized domains**
2. Убедитесь, что добавлены:
   - ✅ `localhost` (для разработки)
   - ✅ `yahor777.github.io` (для GitHub Pages)

Если `yahor777.github.io` нет в списке:
1. Нажмите **"Add domain"**
2. Введите: `yahor777.github.io`
3. Нажмите **"Add"**

---

### Шаг 7: Локальный тест

Запустите проект локально:

```bash
npm run dev
```

1. Откройте приложение: http://localhost:5173
2. Нажмите **"Войти через Google"**
3. Выберите Google аккаунт
4. Разрешите доступ
5. Вы должны войти в приложение! ✅

---

### Шаг 8: Деплой на GitHub Pages

#### 8.1: Добавьте секреты в GitHub Actions

1. Откройте ваш репозиторий: https://github.com/Yahor777/personal-dashboard
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **"New repository secret"** и добавьте:

**Секреты:**
- `VITE_FIREBASE_API_KEY` = `AIzaSyAbc123...`
- `VITE_FIREBASE_AUTH_DOMAIN` = `your-project.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID` = `your-project-id`
- `VITE_FIREBASE_STORAGE_BUCKET` = `your-project.appspot.com`
- `VITE_FIREBASE_MESSAGING_SENDER_ID` = `123456789`
- `VITE_FIREBASE_APP_ID` = `1:123456789:web:abc123`

#### 8.2: Обновите GitHub Actions Workflow

Проверьте, что файл `.github/workflows/deploy.yml` существует. Если нет, создайте:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
        run: npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

#### 8.3: Коммит и push

```bash
git add .
git commit -m "feat: add Google OAuth authentication"
git push origin main
```

Дождитесь завершения GitHub Actions (2-3 минуты).

---

### Шаг 9: Проверка на production

1. Откройте: https://yahor777.github.io/personal-dashboard
2. Обновите страницу (Ctrl+F5 или Cmd+Shift+R)
3. Нажмите **"Войти через Google"**
4. Должен открыться popup с Google Sign-In
5. Войдите и проверьте работу! ✅

---

## 🔍 Устранение проблем

### Ошибка: "Firebase not configured"

**Причина**: `.env.local` файл не создан или неправильные значения.

**Решение**:
1. Проверьте, что `.env.local` существует в корне проекта
2. Убедитесь, что все значения скопированы из Firebase Console
3. Перезапустите `npm run dev`

---

### Ошибка: "Auth domain not authorized"

**Причина**: Домен не добавлен в Firebase Authorized domains.

**Решение**:
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Добавьте `yahor777.github.io`
3. Сохраните и попробуйте снова

---

### Ошибка: "Popup blocked"

**Причина**: Браузер блокирует popup окна.

**Решение**:
1. Приложение автоматически переключится на redirect метод
2. Или разрешите popup для вашего сайта в настройках браузера

---

### Google Sign-In не работает на мобильном

**Причина**: Popup не поддерживается на мобильных браузерах.

**Решение**:
- ✅ Приложение автоматически использует redirect метод на мобильных
- Убедитесь, что домен добавлен в Authorized domains

---

## 📊 Преимущества Google OAuth

### Для пользователей:
- ✅ Вход в один клик (без регистрации)
- ✅ Безопасность (Google управляет паролями)
- ✅ Синхронизация на всех устройствах
- ✅ Автоматическая загрузка фото профиля

### Для вас (разработчика):
- ✅ Не нужно хранить пароли
- ✅ Меньше поддержки (Google обрабатывает восстановление паролей)
- ✅ Повышенная безопасность
- ✅ Бесплатно для вашего use case

---

## 🔐 Безопасность

### Что безопасно?

✅ **API ключи в `.env.local`** - не попадают в Git  
✅ **Firebase Rules** - контролируют доступ к данным  
✅ **GitHub Secrets** - зашифрованы и скрыты  
✅ **HTTPS** - GitHub Pages использует SSL  

### Что делать с `.env.local`?

**⚠️ НИКОГДА НЕ КОММИТЬТЕ `.env.local` В GIT!**

Добавьте в `.gitignore`:

```
.env.local
.env*.local
```

---

## 📈 Следующие шаги (опционально)

### 1. GitHub как база данных (из вашего вопроса)

См. файл: `GOOGLE_AUTH_GITHUB_STORAGE_GUIDE.md`

Там полная инструкция, как:
- Сохранять данные в GitHub private repository
- Делать данные доступными только для вас
- Настроить автоматическую синхронизацию

### 2. Добавить другие провайдеры

Firebase поддерживает:
- GitHub
- Facebook
- Twitter
- Microsoft
- Apple

### 3. Email/Password вход

Можно добавить классический вход с email:
1. Firebase Console → **Authentication** → **Sign-in method**
2. Включите **Email/Password**
3. Обновите форму регистрации

---

## ✅ Checklist

Перед деплоем убедитесь:

- [ ] Firebase проект создан
- [ ] Google Sign-In включен в Firebase Console
- [ ] Домен `yahor777.github.io` добавлен в Authorized domains
- [ ] Файл `.env.local` создан с правильными значениями
- [ ] `.env.local` добавлен в `.gitignore`
- [ ] GitHub Secrets добавлены (6 секретов)
- [ ] GitHub Actions workflow обновлён с env переменными
- [ ] Локально протестирован (`npm run dev`)
- [ ] Коммит и push сделаны
- [ ] GitHub Actions успешно завершился
- [ ] Production протестирован (yahor777.github.io)

---

## 🆘 Нужна помощь?

### Полезные ссылки:

- **Firebase Console**: https://console.firebase.google.com/
- **Firebase Auth Docs**: https://firebase.google.com/docs/auth
- **GitHub Actions Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html

### Проблемы?

Откройте issue на GitHub с:
- Скриншотом ошибки
- Логом из консоли браузера (F12)
- Шагами для воспроизведения

---

**Готово!** 🎉  
Ваше приложение теперь поддерживает Google OAuth!

**Версия**: v0.6.1  
**Дата**: October 11, 2025  
**Статус**: ✅ Ready to configure
