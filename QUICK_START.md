# 🎯 БЫСТРЫЙ СТАРТ - GitHub

## 📋 Что нужно сделать:

### 1️⃣ Создайте репозиторий на GitHub
- Зайдите на github.com
- Нажмите "+" → "New repository"
- Название: `personal-dashboard` (или любое другое)
- НЕ создавайте README/gitignore/license
- Нажмите "Create repository"

### 2️⃣ Откройте PowerShell в папке проекта и выполните:

```powershell
# Инициализация Git
git init

# Добавить все файлы
git add .

# Первый коммит
git commit -m "Initial commit: Personal Dashboard v0.1.0"

# Подключить GitHub (ЗАМЕНИТЕ на свой URL!)
git remote add origin https://github.com/ВАШЕ-ИМЯ/НАЗВАНИЕ-РЕПО.git

# Загрузить на GitHub
git branch -M main
git push -u origin main
```

### 3️⃣ Настройте GitHub Pages
- Зайдите в Settings репозитория
- Выберите Pages в левом меню
- Source: выберите **"GitHub Actions"**
- Готово!

### 4️⃣ Ждите деплоя
- Зайдите в раздел "Actions"
- Подождите пока галочка станет зеленой ✅
- Ваш сайт готов!

## 🌐 Ваш сайт будет доступен по адресу:
```
https://ВАШЕ-ИМЯ.github.io/НАЗВАНИЕ-РЕПО/
```

## 🔄 Обновление сайта в будущем:

```powershell
git add .
git commit -m "Описание изменений"
git push
```

Деплой запустится автоматически!

---

## 📚 Подробные инструкции

Смотрите файлы:
- `GITHUB_SETUP.md` - полная инструкция
- `CHECKLIST.md` - чек-лист проверки
- `README.md` - документация проекта

## ⚡ Перед загрузкой убедитесь:

```powershell
# Установите зависимости
npm install

# Проверьте сборку
npm run build
```

Если обе команды выполнились без ошибок - можете загружать на GitHub! 🚀
