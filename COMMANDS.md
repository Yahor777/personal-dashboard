# 🚀 Команды для копирования

## 📦 Шаг 1: Установка зависимостей (если еще не установлены)

```powershell
npm install
```

## 🔨 Шаг 2: Проверка сборки

```powershell
npm run build
```

## 📤 Шаг 3: Загрузка на GitHub

### ЗАМЕНИТЕ в команде ниже:
- `YOUR-USERNAME` на ваш GitHub username
- `REPO-NAME` на название вашего репозитория

```powershell
git init
git add .
git commit -m "Initial commit: Personal Dashboard App v0.1.0"
git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
git branch -M main
git push -u origin main
```

## 📝 Пример с реальными данными:

Если ваш GitHub username: `ivanov` и репозиторий: `my-dashboard`

```powershell
git init
git add .
git commit -m "Initial commit: Personal Dashboard App v0.1.0"
git remote add origin https://github.com/ivanov/my-dashboard.git
git branch -M main
git push -u origin main
```

## 🔄 Для последующих обновлений:

```powershell
git add .
git commit -m "Описание изменений"
git push
```

## ✅ После загрузки

1. Зайдите в **Settings** → **Pages**
2. **Source**: выберите **"GitHub Actions"**
3. Подождите 2-5 минут
4. Откройте сайт: `https://YOUR-USERNAME.github.io/REPO-NAME/`

---

## 🎯 Готово!

Ваш Personal Dashboard теперь на GitHub и доступен онлайн! 🎉
