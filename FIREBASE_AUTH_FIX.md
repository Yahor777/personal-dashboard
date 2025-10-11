# 🔥 Инструкция: Настройка Google Sign-In в Firebase

## Проблема
Ошибки при входе через Google:
- `ERR_BLOCKED_BY_CLIENT` - блокируется AdBlock/Privacy расширениями
- `auth/unauthorized-domain` - домен не добавлен в Firebase

## ✅ Решение

### 1. Откройте Firebase Console
Перейдите: https://console.firebase.google.com/project/personal-dashboard-204da

### 2. Добавьте домен в Authorized Domains
1. **Authentication** → **Settings** → **Authorized domains**
2. Нажмите **Add domain**
3. Добавьте: `yahor777.github.io`
4. Нажмите **Add**

### 3. Проверьте Google Sign-In метод
1. **Authentication** → **Sign-in method**
2. Найдите **Google** в списке
3. Убедитесь, что статус: **Enabled** (включено)
4. Если отключено - нажмите **Enable**

### 4. Проверьте OAuth redirect URIs
В консоли должны быть:
- `https://personal-dashboard-204da.firebaseapp.com/__/auth/handler`
- `https://yahor777.github.io/__/auth/handler` (добавьте если нет)

### 5. Настройки OAuth consent screen (опционально)
1. Перейдите в Google Cloud Console: https://console.cloud.google.com
2. Выберите проект: **personal-dashboard-204da**
3. **APIs & Services** → **OAuth consent screen**
4. Добавьте **Authorized domains**: `github.io`

## 🎯 Что было исправлено в коде

### 1. Firebase конфигурация (`src/config/firebase.ts`)
- ✅ Analytics теперь не блокирует загрузку (игнорируется если AdBlock)
- ✅ Добавлены параметры `access_type` и `include_granted_scopes`

### 2. Обработка ошибок (`LoginRegisterModal.tsx`)
- ✅ Детальные сообщения об ошибках
- ✅ Логирование для отладки
- ✅ Обработка `auth/unauthorized-domain`

### 3. HTML (`index.html`)
- ✅ Удален CSP (конфликтовал с GitHub Pages)
- ✅ Язык изменен на `ru`

### 4. Заголовки (`public/_headers`)
- ✅ Добавлены безопасные HTTP заголовки

## 🧪 Тестирование

После настройки Firebase:

1. Откройте сайт: https://yahor777.github.io/personal-dashboard/
2. Нажмите "Войти через Google"
3. Выберите аккаунт Google
4. Должен произойти успешный вход

## ⚠️ Ожидаемые предупреждения (нормальные)

В консоли браузера могут быть:
- `ERR_BLOCKED_BY_CLIENT` для Google Analytics - **это нормально**, блокируется AdBlock
- `generate_204` заблокирован - **это нормально**, используется Google для проверки сети

Эти ошибки **НЕ мешают** входу через Google!

## 🆘 Если не работает

1. Проверьте консоль браузера (F12)
2. Найдите сообщение об ошибке
3. Если `auth/unauthorized-domain` - добавьте домен в Firebase Console
4. Если `auth/operation-not-allowed` - включите Google Sign-In в Firebase
5. Очистите кеш браузера (Ctrl+Shift+Delete)

## 📝 Проверка настроек

Выполните в консоли браузера (F12):
```javascript
console.log('Firebase Auth:', auth);
console.log('Google Provider:', googleProvider);
```

Должно показать объекты без ошибок.
