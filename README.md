# Magic Oculus

Веб-приложение со статистикой турниров Magic: The Gathering. Текущая версия проекта собрана как frontend MVP на `React + TypeScript + Vite` и умеет работать как на моках, так и с реальным backend API.

## Что уже есть

- публичные страницы со статистикой:
  - главная;
  - турниры и страница конкретного турнира;
  - игроки и страница конкретного игрока;
  - колоды и страница конкретной колоды;
- фильтры по городу, клубу, формату, типу турнира и датам;
- light theme по умолчанию и dark theme через переключатель в шапке;
- единая token-система цветов в `src/app/styles/globals.css`;
- понятные loading, empty и error states;
- mock-режим без backend;
- временная mock-авторизация для служебного раздела;
- защищённый экран добавления турнира `/admin/tournaments/create`.

## Важные текущие ограничения

- публичные страницы доступны без входа;
- вход сейчас временный и полностью фронтовый;
- экран добавления турнира пока работает через CSV + текстовый список игроков и колод;
- поле `aetherhubUrl` уже добавлено, чтобы позже перейти к более простому импорту по ссылке.

## Быстрый старт

```bash
npm install
npm run dev
```

Локальная production-сборка:

```bash
npm run build
npm run preview
```

Проверки:

```bash
npm run lint
npm run typecheck
npm run test
```

## Переменные окружения

Создайте `.env.local` по примеру из `.env.example`.

Примеры сценариев:

Mock-режим с наполненными данными:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=true
VITE_MOCK_SCENARIO=default
```

Mock-режим для проверки empty states:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=true
VITE_MOCK_SCENARIO=empty
```

Работа с backend:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=false
```

Временная mock-авторизация для служебного раздела:

```env
VITE_ADMIN_LOGIN=admin
VITE_ADMIN_PASSWORD=123456
VITE_ADMIN_DISPLAY_NAME=Администратор
```

## Основные маршруты

- `/`
- `/home` -> редирект на `/`
- `/tournaments`
- `/tournaments/:id`
- `/players`
- `/players/:id`
- `/decks`
- `/decks/:id`
- `/login`
- `/admin/tournaments/create`

## Временный вход для проверки

По умолчанию:

- логин: `admin`
- пароль: `123456`

Это временный сценарий для frontend-only проверки. После подключения backend-auth этот вход нужно заменить на реальные API.

## Где смотреть документацию

Основная карта документации: [readme/README.md](readme/README.md)

Ключевые документы:

- [readme/BACKEND_API_HANDOFF.md](readme/BACKEND_API_HANDOFF.md)
- [readme/ROUTES.md](readme/ROUTES.md)
- [readme/PROJECT_STRUCTURE.md](readme/PROJECT_STRUCTURE.md)
- [readme/UI_GUIDELINES.md](readme/UI_GUIDELINES.md)
- [readme/API_INTEGRATION_CHECKLIST.md](readme/API_INTEGRATION_CHECKLIST.md)
- [readme/TIMEWEB_DEPLOY.md](readme/TIMEWEB_DEPLOY.md)

## Деплой

Приложение собирается в `dist/` и подходит для статического хостинга.

Для Timeweb App Platform текущий рекомендуемый сценарий:

- тип приложения: `Frontend`
- фреймворк: `React`
- ветка: `main`
- Node.js: `22`
- build command: `npm run build`
- output directory: `dist`

Подробности: [readme/TIMEWEB_DEPLOY.md](readme/TIMEWEB_DEPLOY.md)

Важно: приложение использует SPA-routing через `React Router`, поэтому на хостинге должен быть включён fallback на `index.html`.
