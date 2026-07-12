# Project Structure

Этот документ фиксирует текущую структуру проекта, а не стартовый желаемый шаблон. Если структура кода и документ расходятся, сначала обновляется этот файл, а не создаётся новая параллельная архитектура.

## Актуальная структура

```text
src/
  app/
    App.tsx
    providers/
      AuthProvider.tsx
      QueryProvider.tsx
      auth-context.ts
      useAuth.ts
    router/
      RequirePermission.tsx
      router.tsx
    styles/
      globals.css

  entities/
    admin-tournament/
    deck/
    dictionaries/
    player/
    tournament/

  pages/
    create-tournament/
    deck-detail/
    decks/
    home/
    login/
    not-found/
    player-detail/
    players/
    tournament-detail/
    tournaments/

  shared/
    api/
      client.ts
      endpoints.ts
      types.ts
      mocks/
    auth/
      model.ts
      service.ts
      storage.ts
    config/
      env.ts
    lib/
    ui/

  test/

  widgets/
    app-layout/
    deck-metagame/
    deck-performance/
    filters-panel/
    home-highlights/
    popular-matchups/
    recent-tournaments/
    summary-cards/
    top-players/
```

## Зоны ответственности

### `app/`

Глобальная сборка приложения:

- `App.tsx` связывает провайдеры и роутер;
- `providers/` хранит React context и глобальные провайдеры;
- `router/` описывает все маршруты и route guards;
- `styles/globals.css` содержит token-систему, обе темы и общие layout-правила.

### `entities/`

Доменный слой.

Здесь лежат API-функции и небольшие model/helpers для сущностей:

- турниры;
- игроки;
- колоды;
- справочники;
- admin import турнира.

### `pages/`

Route-level компоненты.

Каждая папка соответствует отдельному экрану приложения:

- сбор данных;
- реакция на loading/error/empty;
- сборка страницы из widgets и shared UI.

### `shared/api/`

Базовый API-слой.

Ключевые файлы:

- `client.ts` — общий HTTP-клиент и обработка ошибок;
- `endpoints.ts` — список ручек;
- `types.ts` — главный набор frontend API-типов;
- `mocks/` — mock-ответы для разработки без backend.

`src/shared/api/types.ts` — это фактическая точка опоры для того, какие поля фронт использует на экранах.

### `shared/auth/`

Временная фронтовая авторизация:

- модель сессии и прав;
- mock sign-in;
- хранение токена и сессии в `localStorage`.

Это временный слой до подключения реального backend-auth.

### `shared/lib/`

Утилиты без бизнес-состояния:

- форматирование дат, процентов и record;
- работа с путями сущностей;
- обработка query filters;
- сбор пользовательских ошибок.

### `shared/ui/`

Переиспользуемые UI-компоненты:

- базовые контролы формы;
- таблицы;
- карточки;
- бейджи;
- tooltips/info-hints;
- entity links;
- stat-компоненты;
- MTG color pips.

Компоненты здесь не должны знать, как устроен backend. Они получают уже подготовленные props.

### `widgets/`

Крупные переиспользуемые блоки экранов:

- фильтры;
- summary cards;
- таблицы турниров, игроков, колод и матчапов;
- layout приложения.

### `test/`

Smoke, unit и routing tests.

Здесь уже есть тесты на:

- форматтеры;
- построение путей;
- routing/auth guard;
- сортировку таблиц;
- smoke для главной страницы.

## Практическое правило

Если другой разработчик правит backend integration:

- новые API-типы сначала синхронизируются в `src/shared/api/types.ts`;
- затем обновляются `entities/*/api.ts`;
- затем проверяются `pages/` и `widgets/`;
- после этого обновляется `readme/BACKEND_API_HANDOFF.md`, если контракт реально изменился.
