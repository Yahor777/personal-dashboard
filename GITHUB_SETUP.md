# 🚀 Как перенести проект на GitHub

## Шаг 1: Создайте репозиторий на GitHub

1. Зайдите на [github.com](https://github.com) и войдите в аккаунт
2. Нажмите "+" в правом верхнем углу → "New repository"
3. Введите название (например, `personal-dashboard`)
4. Выберите "Public" или "Private"
5. **НЕ создавайте** README, .gitignore или license (они уже есть в проекте)
6. Нажмите "Create repository"

## Шаг 2: Установите Git (если еще не установлен)

Скачайте Git с [git-scm.com](https://git-scm.com/download/win)

## Шаг 3: Загрузите проект на GitHub

Откройте PowerShell в папке проекта и выполните:

```powershell
# Инициализируйте git репозиторий
git init

# Добавьте все файлы
git add .

# Сделайте первый коммит
git commit -m "Initial commit: Personal Dashboard App"

# Подключите удаленный репозиторий (замените YOUR-USERNAME и REPO-NAME)
git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git

# Загрузите код на GitHub
git branch -M main
git push -u origin main
```

## Шаг 4: Настройте GitHub Pages

1. Зайдите в Settings репозитория на GitHub
2. В левом меню выберите "Pages"
3. В разделе "Build and deployment":
   - **Source**: выберите "GitHub Actions"
4. Готово! Деплой начнется автоматически при каждом push

## Шаг 5: Установите зависимости локально

Перед первым запуском выполните:

```powershell
npm install
```

## 📝 Полезные команды

### Локальная разработка
```powershell
npm run dev          # Запустить dev-сервер (http://localhost:3000)
npm run build        # Собрать production версию
```

### Git команды
```powershell
git status           # Посмотреть изменения
git add .            # Добавить все изменения
git commit -m "Описание изменений"  # Сохранить изменения
git push             # Загрузить на GitHub
```

## 🌐 После первого деплоя

Ваш сайт будет доступен по адресу:
```
https://YOUR-USERNAME.github.io/REPO-NAME/
```

Деплой занимает 2-5 минут. Проверить статус можно в разделе "Actions" на GitHub.

## ❗ Важные замечания

1. **Не загружайте на GitHub**:
   - node_modules (уже в .gitignore)
   - .env файлы с секретами
   - dist/build папки

2. **Перед каждым push**:
   - Проверьте, что проект собирается: `npm run build`
   - Убедитесь, что нет ошибок TypeScript

3. **Обновление на GitHub Pages**:
   - Просто сделайте `git push` - деплой запустится автоматически
   - Следите за процессом в разделе "Actions"

## 🔧 Если что-то пошло не так

### Ошибка при npm install
```powershell
# Очистите кэш и попробуйте снова
npm cache clean --force
npm install
```

### Ошибка при git push
```powershell
# Проверьте, правильно ли указан remote
git remote -v

# Если нужно изменить URL
git remote set-url origin https://github.com/YOUR-USERNAME/REPO-NAME.git
```

### Сайт не открывается на GitHub Pages
1. Проверьте раздел "Actions" - деплой должен быть зеленым ✅
2. Подождите 5-10 минут после первого деплоя
3. Проверьте Settings → Pages - там должен быть URL сайта

## 📚 Дополнительно

- [Документация GitHub Pages](https://pages.github.com/)
- [Документация Vite](https://vitejs.dev/)
- [Документация Git](https://git-scm.com/doc)
