# Project Structure Guidelines

## Цель документа

Этот документ описывает рекомендуемую структуру React-проекта для MTG Global Stats MVP. Агент должен использовать эту структуру как ориентир и не создавать хаотичное расположение файлов.

## Рекомендуемая структура

```text
src/
  app/
    App.tsx
    router/
      router.tsx
    providers/
      QueryProvider.tsx
    styles/
      globals.css

  pages/
    home/
      HomePage.tsx
      components/
    tournaments/
      TournamentsPage.tsx
      components/
    tournament-detail/
      TournamentDetailPage.tsx
      components/
    players/
      PlayersPage.tsx
      components/
    player-detail/
      PlayerDetailPage.tsx
      components/
    decks/
      DecksPage.tsx
      components/
    deck-detail/
      DeckDetailPage.tsx
      components/
    create-tournament/
      CreateTournamentPage.tsx
      components/

  entities/
    tournament/
      model.ts
      api.ts
    player/
      model.ts
      api.ts
    deck/
      model.ts
      api.ts
    city/
      model.ts
      api.ts
    club/
      model.ts
      api.ts
    format/
      model.ts
      api.ts

  widgets/
    app-layout/
      AppLayout.tsx
    filters-panel/
      FiltersPanel.tsx
    summary-cards/
      SummaryCards.tsx
    recent-tournaments/
      RecentTournamentsTable.tsx
    deck-metagame/
      DeckMetagameTable.tsx
    deck-performance/
      DeckPerformanceTable.tsx
    top-players/
      TopPlayersTable.tsx
    popular-matchups/
      PopularMatchupsTable.tsx

  shared/
    api/
      client.ts
      types.ts
      endpoints.ts
      mocks/
        home.mock.ts
        tournaments.mock.ts
        players.mock.ts
        decks.mock.ts
        dictionaries.mock.ts
    config/
      env.ts
    lib/
      formatDate.ts
      formatPercent.ts
      cn.ts
    ui/
      Badge/
      Button/
      Card/
      EmptyState/
      ErrorState/
      FileInput/
      Input/
      LoadingState/
      PageHeader/
      Select/
      StatCard/
      Table/
      Tabs/
```

## Правила организации

### `pages`

В `pages` лежат компоненты верхнего уровня, привязанные к роутам.

Пример:

```text
/pages/home/HomePage.tsx
/pages/tournament-detail/TournamentDetailPage.tsx
```

Страница должна собирать данные, вызывать нужные widgets и отображать состояния загрузки/ошибки.

### `widgets`

В `widgets` лежат крупные блоки интерфейса, которые могут использоваться на страницах.

Примеры:

- `SummaryCards`
- `DeckMetagameTable`
- `RecentTournamentsTable`
- `FiltersPanel`

### `entities`

В `entities` лежит логика доменных сущностей:

- Tournament;
- Player;
- Deck;
- City;
- Club;
- Format.

Там могут быть типы, API-функции и небольшие helpers.

### `shared/ui`

В `shared/ui` лежат переиспользуемые UI-компоненты без бизнес-логики.

Компоненты должны быть простыми, типизированными и не знать про MTG-домен.

### `shared/api`

В `shared/api` лежит общий API-клиент, типы ответов и mock-данные.

API layer должен скрывать от страниц, используются реальные данные или моки.

## Импорты

Предпочтительно использовать понятные относительные импорты или настроить alias `@` на `src`.

Пример:

```ts
import { Button } from '@/shared/ui/Button';
import { getHomeData } from '@/entities/tournament/api';
```

## Что не делать

Не складывать все компоненты в одну папку `components`.

Не писать API-запросы прямо внутри UI-компонентов, если их можно вынести в `entities` или `shared/api`.

Не дублировать типы ответа в разных местах. Общие API-типы должны жить централизованно.

Не делать отдельный стиль для каждого блока, если уже есть базовые компоненты `Card`, `Table`, `Badge`, `StatCard`.
