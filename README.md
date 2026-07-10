# Magic Oculus

Веб-приложение для статистики турниров Magic: The Gathering. Текущая версия собрана как MVP frontend на `React + TypeScript + Vite` и умеет работать как с mock-данными, так и с backend API через env.

## Что уже реализовано

- главная страница с summary, турнирами, метагеймом, performance колод, топом игроков и матчапами;
- список турниров и детальная страница турнира;
- список игроков и детальная страница игрока;
- список колод и детальная страница колоды;
- экран ручного импорта турнира;
- mock-режим без backend;
- фильтры через URL query params;
- loading, empty и error states;
- адаптивная верстка для desktop, tablet и mobile.

## Стек

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Recharts
- ESLint
- Vitest

## Запуск

```bash
npm install
npm run dev
```

Локальная сборка:

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

Mock-режим:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=true
VITE_MOCK_SCENARIO=default
```

Пустой сценарий для проверки empty states:

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

## Основные маршруты

- `/`
- `/tournaments`
- `/tournaments/:id`
- `/players`
- `/players/:id`
- `/decks`
- `/decks/:id`
- `/admin/tournaments/create`

## Деплой

Приложение собирается в `dist/` и готово к статическому хостингу.

### Timeweb App Platform через Git

Рекомендуемый вариант для текущего проекта:

- тип приложения: `Frontend`
- фреймворк: `React`
- Node.js: `22`
- build command: `npm run build`
- output directory: `dist`

Подробный сценарий настройки в панели: [readme/TIMEWEB_DEPLOY.md](/Users/nikita/AndroidStudioProjects/mtg_oculus/readme/TIMEWEB_DEPLOY.md)

Если приложение будет работать в mock-режиме, в переменных окружения Timeweb нужно задать:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=true
VITE_MOCK_SCENARIO=default
```

Если позже подключим backend:

```env
VITE_API_BASE_URL=https://your-api-domain/api/v1
VITE_USE_MOCKS=false
```

Важно: приложение использует SPA-routing через `React Router`, поэтому на хостинге должен быть включен fallback на `index.html`.
