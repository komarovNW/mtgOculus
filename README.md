# Magic Oculus

Веб-приложение со статистикой турниров Magic: The Gathering. Текущая версия проекта собрана как frontend MVP на `React + TypeScript + Vite` и работает с реальным backend API.

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
- Basic auth для служебного раздела загрузки турниров;
- защищённый экран добавления турнира `/admin/tournaments/create`.

## Важные текущие ограничения

- публичные страницы доступны без входа;
- вход в служебный раздел сейчас рассчитан на Basic auth c парой `admin/admin`;
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

Работа с backend:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
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
- пароль: `admin`

Эти данные используются для Basic auth и отправляются как `Authorization: Basic ...` в защищённых запросах.

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
