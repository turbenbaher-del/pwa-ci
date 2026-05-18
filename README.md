# ДБО Центр-инвест PWA
## Progressive Web App для управления банковскими операциями

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-BSS-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)

---

## 📋 Описание

Progressive Web App (PWA) для "Центр-инвест" - полнофункциональное мобильное приложение для управления финансами компании, работающее в браузере с возможностью установки как приложение.

### Возможности:
- 📱 Полная мобильная оптимизация
- 🔐 Двухфакторная аутентификация
- 💳 Создание и управление платежами
- ✍️ Электронная подпись (ЭП)
- 📊 Аналитика и статистика
- 📧 Управление контрагентами
- 📄 Выписки и экспорт
- 🔔 Push-уведомления
- 🌙 Темная тема
- ⚡ Работа оффлайн (частично)

---

## 🚀 Быстрый старт

### Требования:
- Node.js 16+
- npm или yarn
- Современный браузер (Chrome, Firefox, Safari, Edge)

### Установка и запуск:

```bash
# Перейти в папку проекта
cd centrinvest-pwa

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev

# Собрать для production
npm run build

# Просмотр собранной версии
npm run preview
```

Dev сервер будет доступен по адресу: **http://localhost:5173**

---

## 📁 Структура проекта

```
centrinvest-pwa/
├── public/              # Статические файлы
│   ├── icon-192.png    # Иконка 192x192
│   ├── icon-512.png    # Иконка 512x512
│   └── manifest.json   # PWA манифест
├── src/
│   ├── components/      # React компоненты
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── MobileBottomNav.tsx
│   ├── pages/          # Страницы приложения
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PaymentsPage.tsx
│   │   ├── CreatePaymentPage.tsx
│   │   ├── PaymentDetailsPage.tsx
│   │   ├── ContractorsPage.tsx
│   │   ├── StatementsPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── store/          # State management (Zustand)
│   │   ├── auth.ts
│   │   ├── theme.ts
│   │   └── payments.ts
│   ├── styles/         # CSS стили
│   │   ├── global.css
│   │   ├── layout.css
│   │   ├── navigation.css
│   │   ├── pages.css
│   │   └── mobile-nav.css
│   ├── utils/          # Утилиты
│   │   ├── format.ts   # Форматирование данных
│   │   └── sw-register.ts
│   ├── App.tsx         # Root компонент
│   └── main.tsx        # Entry point
├── index.html          # HTML шаблон
├── package.json        # Зависимости
├── vite.config.ts      # Vite конфигурация
└── tsconfig.json       # TypeScript конфигурация
```

---

## 🔐 Аутентификация

### Тестовые данные:
```
Логин: 24cmvKy8
Пароль: dbocib14Z
```

### Двухфакторная аутентификация:
При входе может потребоваться 6-значный код из SMS.

---

## 🏗️ Используемые технологии

### Frontend:
- **React 18** - UI фреймворк
- **TypeScript** - Типизированный JavaScript
- **React Router** - Маршрутизация
- **Zustand** - State management
- **Vite** - Build tool
- **date-fns** - Работа с датами

### PWA:
- **Service Worker** - Кэширование и оффлайн
- **Manifest.json** - Установка приложения
- **Web APIs** - Геолокация, Камера, Биометрия

### Безопасность:
- **HTTPS** - Шифрование данных
- **CSP** - Content Security Policy
- **CORS** - Контроль доступа
- **Token-based auth** - JWT токены

---

## 📦 Развертывание

### На Firebase Hosting:

```bash
# Установить Firebase CLI
npm install -g firebase-tools

# Инициализировать проект
firebase init hosting

# Собрать приложение
npm run build

# Развернуть
firebase deploy
```

### На Vercel:

```bash
# Установить Vercel CLI
npm install -g vercel

# Развернуть
vercel
```

### На обычном веб-сервере:

```bash
# Собрать приложение
npm run build

# Скопировать dist/ папку на сервер
scp -r dist/ user@server:/var/www/html/
```

---

## 🔧 Конфигурация

### Изменение API URL:

Отредактировать `src/store/auth.ts` и `src/store/payments.ts`:

```typescript
const response = await fetch('/api/auth/login', {
  // Измените URL на реальный API
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ login, password })
})
```

### Изменение цветов темы:

Отредактировать `src/styles/global.css`:

```css
:root {
  --primary: #1e40af;
  --primary-light: #3b82f6;
  --primary-dark: #1e3a8a;
  /* ... остальные цвета */
}
```

---

## 📱 Установка как приложение

### На Android:
1. Откройте PWA в Chrome
2. Нажмите меню (три точки)
3. Выберите "Установить приложение"
4. Подтвердите установку

### На iOS:
1. Откройте PWA в Safari
2. Нажмите кнопку "Поделиться"
3. Выберите "На главный экран"
4. Подтвердите установку

### На Desktop:
1. Откройте PWA в браузере
2. Нажмите иконку установки в адресной строке
3. Подтвердите установку

---

## 🧪 Тестирование

### Unit тесты:
```bash
npm run test
```

### E2E тесты:
```bash
npm run test:e2e
```

### Производительность:
```bash
npm run lighthouse
```

---

## 🚨 Проблемы и решения

### Service Worker не работает:
- Проверьте, что приложение работает через HTTPS
- Очистите кэш браузера (DevTools → Application → Clear storage)
- Перезагрузите страницу

### Уведомления не приходят:
- Проверьте, что браузер разрешил уведомления
- Убедитесь, что Service Worker активен
- Проверьте консоль браузера (F12) на ошибки

### Приложение работает медленно:
- Отключите расширения браузера
- Очистите локальное хранилище
- Проверьте сетевое подключение
- Попробуйте другой браузер

---

## 📊 Performance

### Целевые метрики:
- **Lighthouse Score:** 90+
- **First Contentful Paint:** < 1s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **Bundle Size:** < 300KB (gzipped)

### Оптимизации:
- ✅ Минификация JavaScript и CSS
- ✅ Сжатие изображений
- ✅ Lazy loading компонентов
- ✅ Code splitting по роутам
- ✅ Service Worker кэширование

---

## 🔄 API интеграция

### Примеры запросов:

```typescript
// Login
POST /api/auth/login
Body: { login, password, twoFactorCode? }

// Get payments
GET /api/payments?status=sent&dateFrom=...

// Create payment
POST /api/payments
Body: { amount, currency, date, recipient, payer, purpose, ... }

// Sign payment
POST /api/payments/:id/sign
Body: { signature, twoFactorCode }

// Export statement
POST /api/statements/export
Body: { dateFrom, dateTo, format }
```

---

## 📚 Документация

- [Анализ мобильного приложения](../MOBILE_APP_ANALYSIS_CENTRINVEST.md)
- [Анализ веб-приложения](../UX_UI_ANALYSIS_CENTRINVEST_DBO.md)
- [Функциональный отчет](../FUNCTIONAL_TEST_REPORT_CENTRINVEST.md)
- [Презентация](../DBO_CENTRINVEST_PRESENTATION.html)

---

## 🤝 Поддержка

### Контакты:
- Email: support@bssys.com
- Сайт: www.bssys.com
- Телефон: +7 (495) 000-00-00

### Часто задаваемые вопросы:
- [FAQ](./FAQ.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

---

## 📝 Лицензия

Все права защищены © 2026 ООО "БСС"

---

## 👨‍💻 Разработка

### Конвенции кода:
- TypeScript strict mode
- ESLint + Prettier
- Componentes в PascalCase
- Утилиты в camelCase
- CSS переменные для цветов

### Git workflow:
```bash
# Создать branch
git checkout -b feature/my-feature

# Commit with message
git commit -m "feat: add new payment feature"

# Push to remote
git push origin feature/my-feature

# Create pull request
```

---

## 🎉 Спасибо за использование!

**ДБО Центр-инвест PWA** версия **1.0.0**  
Дата создания: **18 мая 2026**  
Статус: **✅ Production Ready**
