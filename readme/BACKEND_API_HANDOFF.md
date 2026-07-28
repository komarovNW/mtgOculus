# Backend API: действующий контракт

Документ объясняет, какие HTTP-ручки и данные использует frontend Magic Oculus.
Он описывает текущее состояние, а не первоначальный MVP-план.

Фактические TypeScript-типы raw-ответов находятся в:

```text
src/shared/api/backend-mappers.ts
```

Если контракт меняется, mapper и этот документ нужно обновлять вместе.

## Базовые правила

### Base URL

Frontend берёт API prefix из:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Все paths ниже указаны относительно этого prefix.

### Авторизация

Публичные GET-запросы и добавление события не требуют `Authorization`. Это
продуктовое требование: любой пользователь может добавить сыгранный дейлик или
турнир.

### Формат

- JSON для GET-запросов;
- `multipart/form-data` для добавления события;
- даты в формате `YYYY-MM-DD`;
- проценты числом в диапазоне `0..100`;
- отсутствующие значения передаются как `null` или поле не передаётся;
- ID могут быть числами в raw API: mapper переводит их в строки для URL.

### Значения по умолчанию

Если пользователь не менял фильтры:

```text
cityId=moscow
formatId=legacy
```

Backend должен иметь эти ID либо frontend defaults должны быть изменены.

## Общие query params

Статистические ручки поддерживают подходящий под них поднабор:

| Параметр | Тип | Значение |
|---|---|---|
| `cityId` | string | город |
| `clubId` | string | клуб выбранного города |
| `formatId` | string | формат |
| `tournamentType` | `daily` или `tournament` | тип события |
| `dateFrom` | `YYYY-MM-DD` | начало периода |
| `dateTo` | `YYYY-MM-DD` | конец периода |

Правила:

- границы периода включаются;
- клуб должен принадлежать выбранному городу;
- одинаковый набор фильтров должен означать одинаковый срез во всех ручках;
- detail страницы игрока и колоды также зависят от текущего среза.

## Общие объекты

```ts
type NamedRef = {
  id: string;
  name: string;
};

type Player = {
  id: number;
  name: string;
};

type Deck = {
  id: number;
  name: string;
  archetype?: string | null;
  colors?: string[] | null;
};
```

Допустимые цвета колоды:

```text
W U B R G C
```

`C` означает бесцветную колоду.

## Пагинация

Списки используют серверную пагинацию:

```json
{
  "count": 137,
  "next": "https://api.example.com/api/v1/decks?page=2&page_size=50",
  "previous": null,
  "results": []
}
```

Query params:

| Параметр | Значение |
|---|---|
| `page` | номер страницы, начиная с 1 |
| `page_size` | размер страницы; frontend использует 50 |

Frontend определяет возможность дозагрузки по `next`. `count` означает размер
полной выборки после фильтрации, но до пагинации.

Допустимо добавить `appliedFilters` рядом с `results`.

## Справочники

### `GET /cities`

Возвращает массив:

```json
[
  { "id": "moscow", "name": "Москва", "country": "Россия" }
]
```

### `GET /cities/{cityId}/clubs`

```json
[
  { "id": "edinorog_moscow", "name": "Единорог", "cityId": "moscow" }
]
```

`cityId` в объекте необязателен: frontend использует ID из URL как fallback.

### `GET /formats`

```json
[
  { "id": "legacy", "name": "Legacy" }
]
```

## Главная

### `GET /home`

Принимает общие фильтры и возвращает:

```ts
{
  appliedFilters?: AppliedFilters | null;
  summary: {
    tournamentsCount: number;
    tournamentPlayersCount: number;
    uniquePlayersCount: number;
    matchesCount: number;
    uniqueDecksCount: number;
  };
  recentTournaments: TournamentListItem[];
  deckMetagame: DeckMetagameItem[];
  deckPerformance: DeckPerformanceItem[];
  topPlayers: PlayerListItem[];
  popularMatchups: PopularMatchupItem[];
}
```

Все агрегаты должны быть рассчитаны по полному отфильтрованному срезу.

## События

### `GET /tournaments`

Дополнительные параметры:

```text
page
page_size
```

Ответ — пагинированный список:

```ts
type TournamentListItem = {
  id: number;
  title: string;
  date: string;
  type: "daily" | "tournament";
  city?: NamedRef | null;
  club?: NamedRef | null;
  format?: NamedRef | null;
  playersCount: number;
  roundsCount: number;
  matchesCount: number;
  winner?: {
    player?: Player | null;
    deck?: Deck | null;
  } | null;
};
```

`/dailies` всегда отправляет `tournamentType=daily`, а `/tournaments` —
`tournamentType=tournament`.

### `GET /tournaments/{id}`

```ts
{
  tournament: TournamentListItem;
  standings: Standing[];
  rounds: Round[];
  playerDecks: PlayerDeck[];
  metagame: TournamentMetagameItem[];
}
```

Строка standings содержит:

```ts
{
  rank: number;
  player: Player;
  deck?: Deck | null;
  record: string;
  points: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  omw?: number | null;
  gw?: number | null;
  ogw?: number | null;
}
```

Матч раунда:

```ts
{
  tableNumber: number;
  playerA: {
    id: number;
    name: string;
    deck?: Deck | null;
    score: number;
  };
  playerB: {
    id: number;
    name: string;
    deck?: Deck | null;
    score: number;
  } | null;
  scoreText: string;
  winnerPlayerId?: number | null;
  isBye?: boolean;
}
```

Для BYE `playerB` может быть `null`, но тогда `isBye` обязательно равен `true`.
Если `playerB` отсутствует без явного `isBye: true`, frontend покажет запись как
неизвестную и исключит её из статистики.

## Игроки

### `GET /players`

Дополнительные параметры:

| Параметр | Значения |
|---|---|
| `search` | часть имени |
| `sort` | `matchWinRate`, `matchesCount`, `tournamentsCount`, `bestRank`, `name` |
| `order` | `asc`, `desc` |
| `page`, `page_size` | пагинация |

Элемент `results`:

```ts
{
  player: Player;
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  mostPlayedDeck?: Deck | null;
  isSmallSample: boolean;
}
```

### `GET /players/{id}`

Принимает общие фильтры:

```ts
{
  appliedFilters?: AppliedFilters | null;
  player: Player;
  summary: PlayerSummary;
  tournaments: PlayerTournament[];
  decks: PlayerDeckStats[];
  recentMatches: PlayerMatch[];
}
```

Несмотря на имя `recentMatches`, текущий UI использует массив как доступную
историю матчей выбранного среза. Для корректного любимого формата и частого
оппонента backend должен возвращать полную историю, а не последние 10–20 строк.
BYE также должны приходить отдельными строками с `isBye: true`: они показываются
в истории раундов и объясняют разницу между числом результатов и реально
сыгранных матчей.

Матч:

```ts
{
  tournament: {
    id: number;
    title: string;
    date: string;
    format?: NamedRef | null;
    type: "daily" | "tournament";
    club?: NamedRef | null;
  };
  roundNumber: number;
  tableNumber: number;
  playerDeck?: Deck | null;
  opponent?: Player | null;
  opponentDeck?: Deck | null;
  playerScore: number;
  opponentScore: number;
  scoreText: string;
  result: "win" | "loss" | "draw";
  isBye: boolean;
}
```

Frontend сам вычисляет из этого массива:

- любимый формат по количеству матчей;
- самого частого оппонента;
- любимую колоду дополнительно сверяет со статистикой участий.

Матчи на странице сгруппированы по событию, поэтому `type`, `id`, `title`,
`date`, `club` и `format` нужны в каждом объекте турнира. BYE также входит в
историю: для него `opponent` равен `null`, а `isBye` равен `true`.
Отсутствующий `opponent` без `isBye: true` не считается BYE и не участвует в
record, проценте побед и агрегатах.

## Колоды

### `GET /decks`

Дополнительные параметры:

```text
search
sort
page
page_size
```

Backend должен возвращать все колоды выбранного среза. Маленькая выборка
помечается `isSmallSample`, но не исключается.

Элемент `results`:

```ts
{
  deck: Deck;
  format?: NamedRef | null;
  tournamentsCount: number;
  playersCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  isSmallSample: boolean;
}
```

### `GET /decks/{id}`

Принимает общие фильтры:

```ts
{
  appliedFilters?: AppliedFilters | null;
  deck: Deck & { format: NamedRef };
  summary: DeckSummary;
  tournamentResults: TournamentDeckResult[];
  players: DeckPlayer[];
  matchups: DeckMatchup[];
}
```

Матчап содержит оппонента, число матчей, победы, поражения, ничьи, winrate и
признак малой выборки.

## Добавление события

### `POST /admin/tournaments/import`

Endpoint публичный и не требует входа.

Тело — `multipart/form-data`:

| Поле | Обязательное | Значение |
|---|---|---|
| `date` | да | дата события |
| `cityId` | да | город |
| `clubId` | да | клуб |
| `tournamentType` | да | `daily` или `tournament` |
| `formatId` | да | формат |
| `aetherhubUrl` | да | ссылка на событие |
| `playerDecksText` | да | список игроков и колод |

Успешный ответ содержит созданное событие и необязательные предупреждения:

```json
{
  "success": true,
  "tournament": {
    "id": 1,
    "title": "Legacy Daily"
  },
  "warnings": []
}
```

Backend должен валидировать входные данные, ограничивать размер и частоту
запросов и не возвращать внутренние ошибки или stack traces.

## Ошибки

API-клиент понимает несколько форматов.

Предпочтительный:

```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "Клуб не принадлежит выбранному городу.",
    "details": [
      {
        "field": "clubId",
        "message": "Выберите клуб другого города.",
        "source": "body"
      }
    ]
  }
}
```

Поддерживается простой `{ "detail": "..." }` и словарь field errors, но единый
формат `error` предпочтительнее.

Рекомендуемые статусы:

| Статус | Значение |
|---|---|
| `400` | некорректный запрос |
| `401` | пользователь не аутентифицирован |
| `403` | недостаточно прав |
| `404` | сущность не найдена |
| `422` | ошибка полей |
| `500` | внутренняя ошибка |

## Правила статистики

- `matchWinRate = wins / (wins + losses + draws) * 100`;
- record записывается как `W-L-D`;
- `matchesCount` должен согласовываться с record;
- `metaShare` рассчитывается по участиям в выбранном срезе;
- `isSmallSample` предупреждает о малой выборке, но не скрывает сущность;
- BYE не является матчем против реального оппонента;
- агрегаты считаются до пагинации.

## Планируемое расширение

Поле `insights` для глобального `Быстрого ориентира` ещё не является частью
обязательного действующего контракта. Требования находятся в
[BACKEND_LIST_INSIGHTS.md](BACKEND_LIST_INSIGHTS.md).

Остальные требования к корректности данных и пагинации собраны в
[BACKEND_DATA_ACCURACY.md](BACKEND_DATA_ACCURACY.md).

Раздел `/digest` сейчас не требует backend API. До появления реального процесса
подготовки и публикации статей не нужно проектировать CMS, список материалов или
ручки детальной статьи.
