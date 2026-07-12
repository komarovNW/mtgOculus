# MTG Global Stats — MVP Web Frontend Brief for AI Agent

> [!WARNING]
> Архивный документ.
> Это ранний MVP brief. После появления login page, защищённого admin route, light/dark theme и обновлённого backend handoff он больше не является источником правды.
> Для текущего состояния проекта используйте `README.md`, `readme/README.md` и `readme/BACKEND_API_HANDOFF.md`.

## 0. Контекст проекта

Мы делаем MVP публичного веб-сайта со статистикой турниров по Magic: The Gathering.

Цель MVP — показать пользователям понятную статистику по загруженным турнирам: метагейм, результативность колод, топ игроков, последние турниры, а также подготовить основу для страниц конкретного турнира, игрока и колоды.

Сайт должен быть публичным. Авторизация для просмотра не нужна.

На первом этапе основной срез данных фиксированный:

- город: Москва;
- формат: Legacy;
- клуб: все клубы;
- тип турнира: все типы;
- период: все загруженные турниры или дефолтный период, который отдаёт backend.

При этом архитектурно нужно сразу заложить фильтры, чтобы позже пользователь мог выбирать:

- город;
- клуб, зависящий от выбранного города;
- формат;
- тип турнира: дейлик / турнир;
- период дат.

Backend API для MVP описан отдельными md-документами:

- `mtg_mvp_create_tournament_api.md` — создание турнира;
- `mtg_mvp_home_page_api.md` — главный публичный экран;
- `mtg_mvp_tournament_detail_api.md` — список турниров и конкретный турнир;
- `mtg_mvp_player_detail_api.md` — список игроков и конкретный игрок;
- `mtg_mvp_deck_detail_api.md` — список колод и конкретная колода.

Этот документ описывает, что нужно сделать frontend-агенту: стек, архитектура, страницы, компоненты, работа с API, состояния, тесты и деплой.

---

## 1. Главный результат работы

В конце работы нужен готовый MVP web frontend на React, который:

1. Запускается локально одной командой.
2. Умеет работать с реальным backend API через `VITE_API_BASE_URL`.
3. Имеет fallback mock-режим, чтобы можно было открыть сайт без готового backend.
4. Показывает главный экран статистики.
5. Поддерживает будущую фильтрацию через URL query params.
6. Имеет страницы-заглушки или базовую реализацию для:
   - списка турниров;
   - конкретного турнира;
   - списка игроков;
   - конкретного игрока;
   - списка колод;
   - конкретной колоды.
7. Имеет понятную структуру проекта, которую можно дальше развивать.
8. Собирается в production build.
9. Готов к деплою как статическое приложение.

---

## 2. Технологический стек

### 2.1. Базовый стек

Использовать:

- React;
- TypeScript;
- Vite;
- React Router;
- TanStack Query;
- CSS Modules или Tailwind CSS;
- Recharts для простых графиков;
- ESLint + Prettier;
- Vitest для unit-тестов.

Рекомендованный вариант:

```text
React + TypeScript + Vite + React Router + TanStack Query + Tailwind CSS + Recharts
```

Причины выбора:

- React подходит для компонентной UI-разработки.
- Vite даёт быстрый dev server и простой production build.
- TypeScript нужен, потому что API-контракты важны и должны быть типизированы.
- TanStack Query нужен для server state: загрузка, кэш, refetch, error/loading states.
- React Router нужен для публичных страниц и будущих detail routes.
- Recharts достаточно для MVP-графиков: bar chart, simple responsive charts.
- Tailwind CSS ускоряет разработку интерфейса без отдельного дизайн-системного слоя.

### 2.2. Что не использовать в MVP

Не использовать в первом MVP:

- Next.js, если не нужен SSR;
- сложный state manager вроде Redux/Zustand для server state;
- тяжелые UI kits без необходимости;
- сложную авторизацию;
- микрофронтенды;
- собственную chart-библиотеку.

---

## 3. Базовая структура проекта

Предлагаемая структура:

```text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx

  shared/
    api/
      httpClient.ts
      apiConfig.ts
    components/
      PageLayout/
      Card/
      StatCard/
      DataTable/
      EmptyState/
      ErrorState/
      LoadingState/
      Badge/
      Tabs/
      FilterBar/
    lib/
      formatDate.ts
      formatPercent.ts
      formatRecord.ts
    types/
      common.ts

  entities/
    tournament/
      api.ts
      types.ts
      components/
    player/
      api.ts
      types.ts
      components/
    deck/
      api.ts
      types.ts
      components/
    filters/
      api.ts
      types.ts
      components/

  pages/
    HomePage/
      HomePage.tsx
      homeApi.ts
      homeTypes.ts
      components/
    TournamentsPage/
      TournamentsPage.tsx
    TournamentDetailPage/
      TournamentDetailPage.tsx
    PlayersPage/
      PlayersPage.tsx
    PlayerDetailPage/
      PlayerDetailPage.tsx
    DecksPage/
      DecksPage.tsx
    DeckDetailPage/
      DeckDetailPage.tsx
    NotFoundPage/
      NotFoundPage.tsx

  mocks/
    handlers.ts
    mockData.ts
```

Можно упростить, если проект маленький, но нужно сохранить принцип:

- API-контракты отдельно;
- UI-компоненты отдельно;
- страницы отдельно;
- переиспользуемые типы отдельно.

---

## 4. Переменные окружения

Нужны env-переменные:

```env
VITE_API_BASE_URL=https://example.com/api/v1
VITE_USE_MOCKS=false
```

Для локального запуска без backend:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_USE_MOCKS=true
```

Правила:

- если `VITE_USE_MOCKS=true`, приложение должно брать данные из mock-слоя;
- если `VITE_USE_MOCKS=false`, приложение должно ходить в backend API;
- базовый URL API не должен быть захардкожен в компонентах.

---

## 5. Routing

Нужны маршруты:

```text
/                         Главный экран статистики
/tournaments              Список турниров
/tournaments/:id          Страница конкретного турнира
/players                  Список игроков
/players/:id              Страница конкретного игрока
/decks                    Список колод
/decks/:id                Страница конкретной колоды
```

Для будущего:

```text
/matchups                 Страница матчапов, не входит в MVP
/admin/tournaments/new    Экран создания турнира, можно не делать в публичном MVP
```

На MVP основной фокус — `/`.

Detail pages можно сделать базово, но ссылки на них должны уже работать из таблиц главной страницы, турниров, игроков и колод.

---

## 6. Общая UI-концепция

Интерфейс должен быть:

- чистый;
- табличный;
- аналитический;
- удобный на desktop;
- нормально читаемый на mobile;
- без перегруженного визуального шума.

Визуальный стиль:

- светлая тема;
- карточки со статистикой;
- таблицы с hover-состоянием строк;
- кликабельные имена игроков, колод и турниров;
- графики только там, где они реально помогают;
- важные числа крупнее текста.

Главное: это не лендинг, а аналитический dashboard.

---

## 7. Общие компоненты

### 7.1. Layout

`PageLayout`:

- верхняя навигация;
- логотип/название проекта;
- ссылки:
  - Главная;
  - Турниры;
  - Игроки;
  - Колоды;
- основной контент с max-width;
- footer с кратким текстом.

### 7.2. StatCard

Используется для summary-блоков.

Поля:

```ts
type StatCardProps = {
  title: string
  value: string | number
  subtitle?: string
}
```

Пример:

```text
Турниров
12
Legacy · Москва
```

### 7.3. DataTable

Переиспользуемая таблица:

- заголовки;
- rows;
- loading state;
- empty state;
- optional click handler;
- responsive поведение.

Можно сначала сделать простую таблицу без виртуализации.

### 7.4. FilterBar

Фильтры должны быть заложены сразу.

Фильтры:

- cityId;
- clubId;
- formatId;
- tournamentType;
- dateFrom;
- dateTo.

На первом этапе дефолт:

```text
cityId=moscow
formatId=legacy
```

`clubId` не передаётся, значит все клубы.

Важно: фильтры должны жить в URL query params, чтобы ссылкой можно было поделиться.

Пример:

```text
/?cityId=moscow&formatId=legacy&clubId=edinorog&dateFrom=2026-01-01&dateTo=2026-12-31
```

Для MVP можно визуально показать фильтры минимально или сделать только подготовку в коде, но архитектурно URL-фильтрация должна быть предусмотрена.

---

## 8. API Client

Сделать единый HTTP client:

```ts
export async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T>
```

Требования:

- подставлять `VITE_API_BASE_URL`;
- корректно сериализовать query params;
- выбрасывать typed error при не-2xx ответе;
- поддерживать AbortSignal, если удобно через TanStack Query;
- не использовать `fetch` напрямую в компонентах.

---

## 9. Справочники фильтров

### 9.1. Форматы

API:

```http
GET /api/v1/formats
```

Тип:

```ts
type Format = {
  id: string
  name: string
}
```

### 9.2. Города

API:

```http
GET /api/v1/cities
```

Тип:

```ts
type City = {
  id: string
  name: string
  country?: string
}
```

### 9.3. Клубы по городу

API:

```http
GET /api/v1/cities/:cityId/clubs
```

Тип:

```ts
type Club = {
  id: string
  name: string
  cityId: string
}
```

Поведение:

- сначала пользователь выбирает город;
- после выбора города подтягиваются клубы;
- если `clubId` не выбран, статистика считается по всем клубам города;
- одинаковые названия клубов в разных городах допустимы, поэтому фронт всегда работает с `clubId`, а не только с названием.

---

## 10. Главная страница `/`

Главная страница — основной экран MVP.

### 10.1. API

```http
GET /api/v1/home?cityId=moscow&formatId=legacy&clubId=&tournamentType=&dateFrom=&dateTo=
```

В MVP фронт вызывает минимум:

```http
GET /api/v1/home?cityId=moscow&formatId=legacy
```

### 10.2. Что показывает экран

Блоки:

1. Header текущего среза.
2. FilterBar.
3. Summary cards.
4. Последние турниры.
5. Метагейм по колодам.
6. Результативность колод.
7. Топ игроков.
8. Частые матчапы.

### 10.3. Summary cards

Поля:

```ts
type HomeSummary = {
  tournamentsCount: number
  tournamentPlayersCount: number
  uniquePlayersCount: number
  matchesCount: number
  uniqueDecksCount: number
}
```

Карточки:

- Турниров;
- Игроко-участий;
- Уникальных игроков;
- Матчей;
- Уникальных колод.

### 10.4. Последние турниры

Таблица:

```text
Дата | Турнир | Тип | Клуб | Игроков | Раундов | Победитель | Колода
```

Кликабельность:

- турнир -> `/tournaments/:id`;
- победитель -> `/players/:id`;
- колода -> `/decks/:id`.

### 10.5. Метагейм по колодам

Вид:

- горизонтальный bar chart top-10 колод;
- таблица под графиком или рядом.

Таблица:

```text
Колода | Игроко-участий | Турниров | Доля меты | Лучшее место
```

Кликабельность:

- колода -> `/decks/:id`.

### 10.6. Результативность колод

Таблица:

```text
Колода | Матчей | Record | Winrate | Лучшее место | Выборка
```

Если `isSmallSample=true`, показать бейдж:

```text
Малая выборка
```

### 10.7. Топ игроков

Таблица:

```text
Игрок | Турниров | Матчей | Record | Winrate | Лучшее место | Частая колода
```

Кликабельность:

- игрок -> `/players/:id`;
- частая колода -> `/decks/:id`.

### 10.8. Частые матчапы

Таблица:

```text
Матчап | Матчей | Record Deck A | Winrate Deck A | Выборка
```

Кликабельность:

- deckA -> `/decks/:id`;
- deckB -> `/decks/:id`.

---

## 11. Страница списка турниров `/tournaments`

Можно сделать базовую страницу в MVP.

API:

```http
GET /api/v1/tournaments?cityId=moscow&formatId=legacy
```

Показывать таблицу:

```text
Дата | Название | Город | Клуб | Формат | Тип | Игроков | Раундов | Победитель | Колода победителя
```

Фильтры такие же, как на главной.

Клик по строке ведёт на `/tournaments/:id`.

---

## 12. Страница конкретного турнира `/tournaments/:id`

### 12.1. API

```http
GET /api/v1/tournaments/:id
```

### 12.2. Блоки

1. Header турнира.
2. Summary cards.
3. Tabs:
   - Standings;
   - Rounds;
   - Decks;
   - Metagame, если backend уже отдаёт.

### 12.3. Header

Показывать:

- название;
- дата;
- город;
- клуб;
- формат;
- тип турнира;
- количество игроков;
- количество раундов;
- количество матчей.

### 12.4. Standings tab

Таблица:

```text
Место | Игрок | Колода | Результат | Очки | OMW | GW | OGW
```

Игрок и колода кликабельны.

### 12.5. Rounds tab

Группировка по раундам:

```text
Раунд 1
Стол | Игрок A | Колода A | Счёт | Игрок B | Колода B
```

### 12.6. Decks tab

Таблица:

```text
Игрок | Колода
```

---

## 13. Страница списка игроков `/players`

API:

```http
GET /api/v1/players?cityId=moscow&formatId=legacy
```

Таблица:

```text
Игрок | Турниров | Матчей | Record | Winrate | Лучшее место | Частая колода
```

Клик по игроку ведёт на `/players/:id`.

---

## 14. Страница конкретного игрока `/players/:id`

API:

```http
GET /api/v1/players/:id?cityId=moscow&formatId=legacy
```

Блоки:

1. Header игрока.
2. Summary cards.
3. Таблица турниров игрока.
4. Таблица колод игрока.
5. Матчи игрока — можно не делать в первой версии, но заложить место.

### 14.1. Summary

Показывать:

- турниров;
- матчей;
- record;
- winrate;
- лучшее место;
- количество колод.

### 14.2. Турниры игрока

Таблица:

```text
Дата | Турнир | Клуб | Колода | Место | Результат | Очки
```

### 14.3. Колоды игрока

Таблица:

```text
Колода | Турниров | Матчей | Record | Winrate | Лучшее место
```

---

## 15. Страница списка колод `/decks`

API:

```http
GET /api/v1/decks?cityId=moscow&formatId=legacy
```

Таблица:

```text
Колода | Архетип | Цвета | Игроко-участий | Турниров | Матчей | Record | Winrate | Лучшее место
```

Клик по колоде ведёт на `/decks/:id`.

---

## 16. Страница конкретной колоды `/decks/:id`

API:

```http
GET /api/v1/decks/:id?cityId=moscow&formatId=legacy
```

Блоки:

1. Header колоды.
2. Summary cards.
3. Результаты по турнирам.
4. Игроки, игравшие колодой.
5. Матчапы — можно не делать в первой версии, но заложить место.

### 16.1. Summary

Показывать:

- игроко-участий;
- турниров;
- матчей;
- record;
- winrate;
- лучшее место.

### 16.2. Результаты по турнирам

Таблица:

```text
Дата | Турнир | Клуб | Игрок | Место | Результат | Очки
```

### 16.3. Игроки на колоде

Таблица:

```text
Игрок | Турниров | Матчей | Record | Winrate | Лучшее место
```

---

## 17. Состояния экранов

Каждый экран должен иметь:

### Loading

Показывать skeleton или простой loader.

### Empty

Если API вернул пустые массивы, показывать понятный текст.

Пример:

```text
Пока нет загруженных турниров по Legacy в Москве.
```

### Error

Если API вернул ошибку:

- показать текст ошибки;
- дать кнопку “Повторить”;
- не показывать пустую таблицу без объяснения.

### Small sample

Если backend отдаёт `isSmallSample=true`, показывать бейдж:

```text
Малая выборка
```

---

## 18. Работа с числами и форматированием

### Даты

В API дата приходит в формате:

```text
YYYY-MM-DD
```

На UI показывать:

```text
08.07.2026
```

### Проценты

Если API отдаёт число:

```json
61.1
```

На UI показывать:

```text
61.1%
```

### Record

Если API отдаёт отдельно wins/losses/draws, на UI показывать:

```text
11-7
11-7-1
```

Если API отдаёт готовую строку record, использовать её.

---

## 19. Mock data

Нужны mock-данные для всех ключевых страниц:

- `/api/v1/home`;
- `/api/v1/tournaments`;
- `/api/v1/tournaments/:id`;
- `/api/v1/players`;
- `/api/v1/players/:id`;
- `/api/v1/decks`;
- `/api/v1/decks/:id`;
- `/api/v1/cities`;
- `/api/v1/cities/:cityId/clubs`;
- `/api/v1/formats`.

Mock data должны быть похожи на реальные данные из проекта:

- город: Москва;
- формат: Legacy;
- клубы: Единорог, GoldFish или другие тестовые;
- колоды: Lands, UB Tempo, UR Painter, Eldrazi, Doomsday, BG Order;
- игроки: можно использовать тестовые имена из наших примеров.

---

## 20. Тесты

Минимальные тесты:

1. Компонент `StatCard` корректно отображает title/value.
2. Компонент `DataTable` показывает empty state.
3. `formatPercent` добавляет `%`.
4. `formatDate` превращает `YYYY-MM-DD` в `DD.MM.YYYY`.
5. Главная страница показывает summary при mock data.
6. При ошибке API показывается error state.

Не нужно в MVP писать большой e2e-пакет, но архитектура должна позволить добавить Playwright позже.

---

## 21. Адаптивность

Минимальные требования:

- desktop: таблицы показываются полноценно;
- tablet: таблицы остаются читаемыми;
- mobile: таблицы могут горизонтально скроллиться;
- summary cards перестраиваются в одну колонку;
- фильтры на mobile могут быть свернуты в блок.

---

## 22. Деплой

MVP frontend должен деплоиться как статическое приложение.

### 22.1. Build

Команды:

```bash
npm install
npm run build
```

или, если выбран pnpm:

```bash
pnpm install
pnpm build
```

Результат сборки:

```text
dist/
```

### 22.2. Hosting

Можно деплоить на:

- Timeweb Cloud static/app hosting;
- Vercel;
- Netlify;
- любой nginx/static hosting.

Для SPA нужен fallback:

```text
all routes -> /index.html
```

Иначе прямой переход на `/players/:id` или `/tournaments/:id` будет давать 404 на уровне хостинга.

### 22.3. Environment variables on hosting

На хостинге нужно указать:

```env
VITE_API_BASE_URL=https://backend-domain.ru/api/v1
VITE_USE_MOCKS=false
```

---

## 23. Критерии готовности MVP frontend

Работа считается готовой, если:

1. Проект запускается локально.
2. Проект собирается без ошибок TypeScript.
3. Есть главный экран `/` с реальными блоками статистики.
4. Фильтры заложены через URL query params.
5. Есть базовые страницы `/tournaments`, `/tournaments/:id`, `/players`, `/players/:id`, `/decks`, `/decks/:id`.
6. Все кликабельные сущности имеют стабильные ссылки по id.
7. Есть loading, empty и error states.
8. Есть mock data для автономной разработки.
9. Есть README с командами запуска, сборки и деплоя.
10. В коде нет захардкоженного backend URL.

---

## 24. Порядок разработки для агента

Делать строго по шагам.

### Шаг 1. Инициализация проекта

- Создать React + TypeScript + Vite проект.
- Настроить ESLint/Prettier.
- Настроить базовую структуру папок.
- Добавить env-конфиг.

### Шаг 2. Routing и layout

- Добавить маршруты.
- Сделать общий layout.
- Добавить навигацию.
- Добавить NotFound page.

### Шаг 3. API layer

- Сделать `httpClient`.
- Сделать типы API.
- Сделать mock data.
- Подключить TanStack Query.

### Шаг 4. Shared UI

- Card.
- StatCard.
- DataTable.
- LoadingState.
- EmptyState.
- ErrorState.
- Badge.
- FilterBar.

### Шаг 5. Главная страница

- Подключить `GET /home`.
- Показать summary.
- Показать recent tournaments.
- Показать deck metagame.
- Показать deck performance.
- Показать top players.
- Показать popular matchups.

### Шаг 6. Detail routes

- Сделать список турниров.
- Сделать страницу турнира.
- Сделать список игроков.
- Сделать страницу игрока.
- Сделать список колод.
- Сделать страницу колоды.

### Шаг 7. States и polishing

- Проверить loading/empty/error.
- Проверить мобильную верстку.
- Проверить кликабельность всех ссылок.
- Проверить фильтры в URL.

### Шаг 8. Build и deploy documentation

- Проверить production build.
- Добавить README.
- Описать переменные окружения.
- Описать fallback для SPA.

---

## 25. Важные принципы реализации

1. Не считать сложную статистику на фронте.
   Frontend отображает данные, которые отдал backend.

2. Не использовать имена как id.
   Все ссылки строятся через `id`: `player.id`, `deck.id`, `tournament.id`.

3. Не завязываться на Москву и Legacy в коде.
   Это дефолтные фильтры, но архитектурно фильтры должны быть параметрами.

4. Не смешивать API и UI.
   Компоненты не должны напрямую знать URL backend.

5. Не делать авторизацию.
   Сайт публичный для чтения.

6. Не делать admin UI в рамках этого MVP, если не поставлена отдельная задача.

7. Не блокировать развитие.
   Страницы и типы должны быть расширяемыми под будущие поля: archetype, colors, matchups, decklists, advanced filters.

---

## 26. Что агент должен вернуть в конце

Агент должен предоставить:

1. Исходный код React-проекта.
2. README с командами:
   - install;
   - dev;
   - build;
   - preview;
   - deploy notes.
3. Описание структуры проекта.
4. Список реализованных страниц.
5. Список env-переменных.
6. Инструкцию, как включить mock data.
7. Список известных ограничений MVP.
8. Что нужно сделать следующим этапом.

---

## 27. Known limitations MVP

В MVP допускается:

- минимальный дизайн без полноценной дизайн-системы;
- простые таблицы без серверной пагинации;
- mock data до готовности backend;
- неидеальная мобильная таблица с горизонтальным скроллом;
- отсутствие авторизации;
- отсутствие admin creation screen;
- отсутствие сложных рейтингов игроков;
- отсутствие отдельной страницы матчапов.

Но не допускается:

- отсутствие типов API;
- хардкод данных внутри компонентов;
- отсутствие loading/error/empty states;
- использование player/deck names вместо id для роутинга;
- захардкоженный backend URL;
- отсутствие production build.
