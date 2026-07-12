# Magic Oculus: backend API handoff

## Как пользоваться этим документом

Это главный актуальный документ для backend-разработки и refactor интеграции.

Если в репозитории встретятся старые MVP-черновики с другими формулировками:

- используйте этот файл как основной источник правды;
- сверяйтесь с `src/shared/api/types.ts`, если нужен точный shape полей;
- считайте файлы `readme/mtg_mvp_*` и старые prompt docs архивными.

Отдельно важно:

- текущий вход на фронте пока временный и локальный;
- реальные auth endpoints всё равно уже нужны и описаны ниже;
- импорт турнира пока идёт через CSV + `playerDecksText`, но поле `aetherhubUrl` уже добавлено для следующего этапа.

Этот документ описывает, что текущий frontend **реально ожидает от backend** по данным, ручкам, фильтрам, авторизации и ошибкам.

Документ составлен по текущему коду frontend в `src/`, а не по старым черновикам. Если backend будет сделан по этому файлу, фронт можно будет переключать с mock-данных на real API без угадывания структуры.

## 1. Что уже есть на frontend

Текущий frontend состоит из таких экранов:

| Экран | Route | Какие API нужны |
|---|---|---|
| Главная | `/` | `GET /home`, `GET /cities`, `GET /formats`, `GET /cities/:cityId/clubs` |
| Список турниров | `/tournaments` | `GET /tournaments`, `GET /cities`, `GET /formats`, `GET /cities/:cityId/clubs` |
| Детали турнира | `/tournaments/:id` | `GET /tournaments/:id` |
| Список игроков | `/players` | `GET /players`, `GET /cities`, `GET /formats`, `GET /cities/:cityId/clubs` |
| Детали игрока | `/players/:id` | `GET /players/:id`, `GET /cities`, `GET /formats`, `GET /cities/:cityId/clubs` |
| Список колод | `/decks` | `GET /decks`, `GET /cities`, `GET /formats`, `GET /cities/:cityId/clubs` |
| Детали колоды | `/decks/:id` | `GET /decks/:id`, `GET /cities`, `GET /formats`, `GET /cities/:cityId/clubs` |
| Вход | `/login` | `POST /auth/login`, желательно `GET /auth/me`, опционально `POST /auth/logout` |
| Добавление турнира | `/admin/tournaments/create` | `GET /cities`, `GET /formats`, `GET /cities/:cityId/clubs`, `POST /admin/tournaments/import` |

## 2. Критичные зависимости frontend, о которых backend должен знать

### 2.1. Текущие default filter ids

Frontend сейчас по умолчанию работает с такими id:

- `cityId = "moscow"`
- `formatId = "legacy"`

Это зашито в frontend.

Следствие:

- либо backend должен реально иметь город с `id = "moscow"` и формат с `id = "legacy"`;
- либо перед интеграцией надо отдельно менять frontend defaults.

Если backend вернёт другие id, текущий frontend начнёт слать фильтры на несуществующие сущности и получать `400`.

### 2.2. Все проценты frontend ждёт в диапазоне `0..100`

Frontend сам добавляет знак `%` и округляет значения до 1 знака.

Правильно:

- `52.0833`
- `100`
- `0`

Неправильно:

- `0.520833`
- `"52.1%"`

Это касается:

- `metaShare`
- `matchWinRate`
- `deckAWinRate`
- `winRate`
- `omw`
- `gw`
- `ogw`
- `gameWinRate`

### 2.3. `id` используются прямо в URL

Frontend строит ссылки так:

- `/tournaments/:id`
- `/players/:id`
- `/decks/:id`

Значит:

- `id` должны быть стабильными;
- `id` не должны меняться со временем;
- желательно делать `id` URL-safe: slug, uuid, snowflake, database id в строке.

### 2.4. Ошибки backend пользователь увидит почти напрямую

Frontend читает ошибки в формате:

```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Понятный текст ошибки",
    "details": [
      {
        "field": "fieldName",
        "message": "Что именно не так",
        "source": "body"
      }
    ]
  }
}
```

Важно:

- `error.message` должен быть **понятным человеку**;
- лучше сразу писать его по-русски;
- `details` нужны для валидации формы импорта турнира.

## 3. Общие правила API

### 3.1. Base URL

Frontend сейчас ожидает базу:

```text
/api/v1
```

Примеры:

- `GET /api/v1/home`
- `GET /api/v1/tournaments`
- `POST /api/v1/auth/login`
- `POST /api/v1/admin/tournaments/import`

### 3.2. Формат данных

- public endpoints: `application/json`
- login endpoint: `application/json`
- tournament import: `multipart/form-data`

### 3.2.1. Authorization header

После логина frontend будет слать:

```text
Authorization: Bearer <token>
```

Сейчас этот header уходит на все запросы, если пользователь залогинен.

Значит:

- protected endpoints должны его проверять;
- public endpoints должны спокойно переживать его наличие и не падать из-за лишнего header.

### 3.3. Даты

Во всех фильтрах и основных сущностях frontend ждёт формат:

```text
YYYY-MM-DD
```

Примеры:

- `2026-07-11`
- `2026-06-24`

### 3.4. Nullable-поля

Если значение неизвестно, лучше отдавать `null`, а не выдумывать строку.

Примеры:

- `bestRank: null`
- `winner: null`
- `deck: null`

### 3.5. Справочники

Все фильтры и формы завязаны на справочники:

- города;
- клубы;
- форматы.

Frontend использует **id** как значение в query params и формах, а **name** показывает пользователю.

### 3.6. Applied filters

Во многих ответах frontend ждёт блок `appliedFilters`, чтобы показывать бейджи текущего фильтра не по id, а по нормальным названиям.

Формат:

```ts
type AppliedFilters = {
  city?: { id: string; name: string; country?: string } | null;
  club?: { id: string; name: string; cityId: string } | null;
  format?: { id: string; name: string } | null;
  tournamentType?: 'daily' | 'tournament' | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};
```

## 4. Общие сущности

Ниже минимальные сущности, которые реально используются в UI.

```ts
type City = {
  id: string;
  name: string;
  country?: string;
};

type Club = {
  id: string;
  name: string;
  cityId: string;
};

type Format = {
  id: string;
  name: string;
};

type PlayerShort = {
  id: string;
  name: string;
};

type DeckShort = {
  id: string;
  name: string;
  archetype?: string | null;
  colors?: string[] | null; // W, U, B, R, G, C
};
```

### 4.1. Deck colors

Frontend поддерживает такие значения `colors`:

- `W`
- `U`
- `B`
- `R`
- `G`
- `C`

Лучше отдавать их именно так, в верхнем регистре.

### 4.2. BYE

Во фронте есть специальный кейс для bye-пары.

Если в раунде есть BYE, безопасный формат:

```json
{
  "id": "player_bye",
  "name": "BYE"
}
```

Такой `id` frontend не будет превращать в ссылку на профиль игрока.

## 5. Математика и правила расчёта метрик

Эти правила важны, потому что frontend уже заточен именно под такую логику.

### 5.1. Match counts

```text
matchesCount = matchWins + matchLosses + matchDraws
```

### 5.2. Match win rate

```text
matchWinRate = matchWins / matchesCount * 100
```

Если матчей нет:

```text
matchWinRate = 0
```

### 5.3. Tournament participations

`Участий в турнирах` = сколько раз игрок или колода вообще встречались в турнирах.

Пример:

- один игрок сыграл 3 турнира -> это `3 участия`;
- одна и та же колода встретилась у 5 игроков в 2 турнирах -> считаем фактические появления в standings.

### 5.4. Meta share

Для home/deck metagame:

```text
metaShare = playersCount / totalTournamentPlayersCount * 100
```

Для tournament detail:

```text
metaShare = playersCount / totalPlayersInTournament * 100
```

### 5.5. Small sample

Сейчас frontend/mock логика считает малой выборкой:

```text
isSmallSample = matchesCount < 5
```

Если backend захочет другой порог, надо будет отдельно синхронизировать это с frontend.

### 5.6. Matchup win rate

Для `PopularMatchupItem`:

```text
deckAWinRate = deckAWins / matchesCount * 100
```

Для `DeckMatchupItem`:

```text
winRate = wins / matchesCount * 100
```

### 5.7. Record string

Во фронте record показывается в формате:

- `wins-losses`
- `wins-losses-draws`, если ничьи есть

Примеры:

- `4-0`
- `11-1`
- `25-21-2`

## 6. Фильтры и query params

Следующие query params уже реально используются фронтом:

| Query param | Тип | Где используется |
|---|---|---|
| `cityId` | `string` | home, tournaments, players, decks, player detail, deck detail |
| `clubId` | `string` | те же страницы |
| `formatId` | `string` | те же страницы |
| `tournamentType` | `daily \| tournament` | те же страницы |
| `dateFrom` | `YYYY-MM-DD` | те же страницы |
| `dateTo` | `YYYY-MM-DD` | те же страницы |
| `search` | `string` | только `/players` |
| `sort` | `string` | `/players`, `/decks` |
| `order` | `asc \| desc` | `/players` |
| `page` | `number >= 1` | списки |
| `limit` | `number >= 1` | списки |

Если фильтр отсутствует:

- backend должен интерпретировать это как “не фильтровать по этому полю”.

Если `dateFrom > dateTo`:

- вернуть `400`.

## 7. Pagination

Списковые ручки должны возвращать:

```ts
type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasMore?: boolean;
};
```

Минимум, который нужен фронту прямо сейчас:

- `page`
- `limit`
- `total`

Но лучше сразу вернуть и:

- `totalPages`
- `hasMore`

## 8. Public API

---

### 8.1. `GET /home`

Главная страница.

#### Query params

- `cityId?`
- `clubId?`
- `formatId?`
- `tournamentType?`
- `dateFrom?`
- `dateTo?`

#### Response

```ts
type HomeResponse = {
  appliedFilters: AppliedFilters;
  summary: {
    tournamentsCount: number;
    tournamentPlayersCount: number;
    uniquePlayersCount: number;
    matchesCount: number;
    uniqueDecksCount: number;
  };
  recentTournaments: RecentTournamentItem[];
  deckMetagame: DeckMetagameItem[];
  deckPerformance: DeckPerformanceItem[];
  topPlayers: TopPlayerItem[];
  popularMatchups: PopularMatchupItem[];
};
```

#### Nested types

```ts
type RecentTournamentItem = {
  id: string;
  title: string;
  date: string;
  type: 'daily' | 'tournament';
  city: City;
  club: Club;
  format: Format;
  playersCount: number;
  roundsCount: number;
  winner?: {
    player: PlayerShort;
    deck: DeckShort;
  } | null;
};

type DeckMetagameItem = {
  deck: DeckShort;
  playersCount: number;
  tournamentsCount: number;
  metaShare: number;
  bestRank?: number | null;
};

type DeckPerformanceItem = {
  deck: DeckShort;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  isSmallSample: boolean;
};

type TopPlayerItem = {
  player: PlayerShort;
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  mostPlayedDeck?: DeckShort;
  isSmallSample: boolean;
};

type PopularMatchupItem = {
  deckA: DeckShort;
  deckB: DeckShort;
  matchesCount: number;
  deckAWins: number;
  deckBWins: number;
  draws: number;
  deckAWinRate: number;
  isSmallSample: boolean;
};
```

#### Важные требования к сортировке

Backend должен сразу отдавать массивы в порядке, удобном для главной:

- `recentTournaments`: по `date desc`
- `deckMetagame`: по `playersCount desc`, дальше по значимой вторичной логике
- `deckPerformance`: по `matchWinRate desc`, затем `matchesCount desc`
- `topPlayers`: по `matchWinRate desc`, затем `matchesCount desc`
- `popularMatchups`: по `matchesCount desc`, затем `deckAWinRate desc`

Это важно, потому что frontend использует первые элементы массивов в highlights и spotlight-блоках.

---

### 8.2. `GET /tournaments`

Список турниров.

#### Query params

- `cityId?`
- `clubId?`
- `formatId?`
- `tournamentType?`
- `dateFrom?`
- `dateTo?`
- `page?`
- `limit?`

#### Response

```ts
type TournamentListResponse = {
  items: TournamentListItem[];
  pagination: Pagination;
  appliedFilters: AppliedFilters;
};

type TournamentListItem = {
  id: string;
  title: string;
  date: string;
  type: 'daily' | 'tournament';
  city: City;
  club: Club;
  format: Format;
  playersCount: number;
  roundsCount: number;
  matchesCount: number;
  winner?: {
    player: PlayerShort;
    deck: DeckShort;
  } | null;
};
```

#### Default sort

Нужен порядок:

- `date desc`

Потому что текущий экран использует первый элемент как “самый свежий турнир”.

---

### 8.3. `GET /tournaments/:id`

Детали конкретного турнира.

#### Response

```ts
type TournamentDetailsResponse = {
  tournament: TournamentDetails;
  standings: TournamentStandingItem[];
  rounds: TournamentRound[];
  playerDecks: TournamentPlayerDeckItem[];
  metagame: TournamentMetagameItem[];
};
```

#### Nested types

```ts
type TournamentDetails = {
  id: string;
  title: string;
  date: string;
  type: 'daily' | 'tournament';
  city: City;
  club: Club;
  format: Format;
  playersCount: number;
  roundsCount: number;
  matchesCount: number;
  winner?: {
    player: PlayerShort;
    deck: DeckShort;
  } | null;
};

type TournamentStandingItem = {
  rank: number;
  player: PlayerShort;
  deck?: DeckShort | null;
  record: string;
  points: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  omw?: number | null;
  gw?: number | null;
  ogw?: number | null;
};

type TournamentRoundMatch = {
  tableNumber: number;
  playerA: {
    id: string;
    name: string;
    deck?: DeckShort | null;
    score: number;
  };
  playerB: {
    id: string;
    name: string;
    deck?: DeckShort | null;
    score: number;
  };
  scoreText: string;
  winnerPlayerId?: string | null;
};

type TournamentRound = {
  roundNumber: number;
  matches: TournamentRoundMatch[];
};

type TournamentPlayerDeckItem = {
  player: PlayerShort;
  deck?: DeckShort | null;
  rank?: number | null;
  record?: string | null;
};

type TournamentMetagameItem = {
  deck: DeckShort;
  playersCount: number;
  metaShare: number;
  bestRank: number;
};
```

#### Порядок массивов

- `standings`: по `rank asc`
- `rounds`: по `roundNumber asc`
- `rounds[*].matches`: по `tableNumber asc`
- `playerDecks`: лучше по `rank asc`, потом `player.name asc`
- `metagame`: по `playersCount desc`, потом `bestRank asc`

#### Отдельно важно

- `omw`, `gw`, `ogw` фронт считает процентами `0..100`
- `scoreText` фронт показывает как есть, но отдельно использует ещё `playerA.score` и `playerB.score` для сортировки

---

### 8.4. `GET /players`

Список игроков.

#### Query params

- `cityId?`
- `clubId?`
- `formatId?`
- `tournamentType?`
- `dateFrom?`
- `dateTo?`
- `search?` - поиск по имени игрока, case-insensitive contains
- `sort?` - одно из:
  - `matchWinRate`
  - `matchesCount`
  - `tournamentsCount`
  - `bestRank`
  - `name`
- `order?` - `asc | desc`
- `page?`
- `limit?`

#### Response

```ts
type PlayersListResponse = {
  appliedFilters: AppliedFilters;
  pagination: Pagination;
  items: PlayerListItem[];
};

type PlayerListItem = {
  player: PlayerShort;
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  mostPlayedDeck?: DeckShort;
  isSmallSample: boolean;
};
```

#### Behaviour

- backend должен реально поддерживать `search`, `sort`, `order`
- если сортировка по `bestRank`, то меньший `bestRank` лучше
- если `bestRank` отсутствует, такие игроки должны уходить вниз

---

### 8.5. `GET /players/:id`

Детали игрока.

#### Query params

- `cityId?`
- `clubId?`
- `formatId?`
- `tournamentType?`
- `dateFrom?`
- `dateTo?`

#### Response

```ts
type PlayerDetailsResponse = {
  appliedFilters: AppliedFilters;
  player: PlayerShort;
  summary: PlayerSummary;
  tournaments: PlayerTournamentItem[];
  decks: PlayerDeckItem[];
  recentMatches?: PlayerMatchItem[];
};
```

#### Nested types

```ts
type PlayerSummary = {
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  gameWins?: number;
  gameLosses?: number;
  gameDraws?: number;
  gameWinRate?: number;
  bestRank?: number | null;
  averageRank?: number | null;
  uniqueDecksCount: number;
  isSmallSample: boolean;
};

type PlayerTournamentItem = {
  tournament: {
    id: string;
    title: string;
    date: string;
    type: 'daily' | 'tournament';
    city: City;
    club: Club;
    format: Format;
    playersCount: number;
  };
  deck?: DeckShort | null;
  rank: number;
  record: string;
  points: number;
  omw?: number | null;
  gw?: number | null;
  ogw?: number | null;
};

type PlayerDeckItem = {
  deck: DeckShort;
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  isSmallSample: boolean;
};

type PlayerMatchItem = {
  tournament: {
    id: string;
    title: string;
    date: string;
    format: Format;
  };
  roundNumber: number;
  tableNumber: number;
  playerDeck?: DeckShort | null;
  opponent: PlayerShort;
  opponentDeck?: DeckShort | null;
  playerScore: number;
  opponentScore: number;
  scoreText: string;
  result: 'win' | 'loss' | 'draw';
};
```

#### Порядок массивов

- `tournaments`: по `tournament.date desc`
- `decks`: лучше по `tournamentsCount desc`, потом `matchesCount desc`
- `recentMatches`: по `tournament.date desc`, внутри турнира по `roundNumber asc`, потом `tableNumber asc`

#### Отдельно важно

- `recentMatches` используется для вкладки истории матчей
- `result` должен быть уже посчитан именно **с точки зрения игрока этой страницы**
- `playerScore` и `opponentScore` тоже должны быть уже нормализованы **с точки зрения игрока этой страницы**

---

### 8.6. `GET /decks`

Список колод.

#### Query params

- `cityId?`
- `clubId?`
- `formatId?`
- `tournamentType?`
- `dateFrom?`
- `dateTo?`
- `sort?` - одно из:
  - `playersCount_desc`
  - `matchWinRate_desc`
  - `matchesCount_desc`
  - `bestRank_asc`
  - `name_asc`
- `page?`
- `limit?`

#### Response

```ts
type DecksListResponse = {
  items: DeckListItem[];
  pagination: Pagination;
  appliedFilters: AppliedFilters;
};

type DeckListItem = {
  deck: DeckShort;
  format: Format;
  tournamentsCount: number;
  playersCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  isSmallSample: boolean;
};
```

#### Behaviour

Backend должен реально поддерживать переданный `sort`.

---

### 8.7. `GET /decks/:id`

Детали колоды.

#### Query params

- `cityId?`
- `clubId?`
- `formatId?`
- `tournamentType?`
- `dateFrom?`
- `dateTo?`

#### Response

```ts
type DeckDetailsResponse = {
  deck: DeckShort & {
    format: Format;
  };
  appliedFilters: AppliedFilters;
  summary: DeckSummary;
  tournamentResults: TournamentDeckResultItem[];
  players: DeckPlayerItem[];
  matchups: DeckMatchupItem[];
};
```

#### Nested types

```ts
type DeckSummary = {
  tournamentsCount: number;
  playersCount: number;
  uniquePlayersCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  isSmallSample: boolean;
};

type TournamentDeckResultItem = {
  tournament: {
    id: string;
    title: string;
    date: string;
    type: 'daily' | 'tournament';
    city: City;
    club: Club;
    format: Format;
    playersCount: number;
  };
  player: PlayerShort;
  rank: number;
  record: string;
  points: number;
};

type DeckPlayerItem = {
  player: PlayerShort;
  tournamentsCount: number;
  matchesCount: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  matchWinRate: number;
  bestRank?: number | null;
  isSmallSample: boolean;
};

type DeckMatchupItem = {
  opponentDeck: DeckShort;
  matchesCount: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  isSmallSample: boolean;
};
```

#### Порядок массивов

- `tournamentResults`: по `tournament.date desc`
- `players`: лучше по `matchWinRate desc`, потом `matchesCount desc`
- `matchups`: по `matchesCount desc`

#### Отдельно важно

- `deck.format` нужен для бейджа на странице колоды
- `deck.archetype` показывается в описании страницы

## 9. Dictionary API

---

### 9.1. `GET /cities`

#### Response

```ts
type CitiesResponse = {
  items: City[];
};
```

---

### 9.2. `GET /cities/:cityId/clubs`

#### Response

```ts
type ClubsResponse = {
  items: Club[];
};
```

#### Behaviour

- вернуть только клубы конкретного города
- если `cityId` не существует, вернуть `404` или `400`, но единообразно во всём API

---

### 9.3. `GET /formats`

#### Response

```ts
type FormatsResponse = {
  items: Format[];
};
```

## 10. Auth and authorization API

Сейчас на frontend уже есть protected route для `/admin/tournaments/create`.

Временная local-only авторизация уже сделана на фронте, но для реального backend нужен настоящий auth API.

### 10.1. Минимально необходимый permission model

Сейчас frontend уже умеет работать с permissions.

Минимум:

```ts
type AuthPermission = 'tournament:create';
```

Пользователь должен приходить хотя бы с таким набором:

```ts
type AuthUser = {
  id: string;
  login: string;
  name: string;
  role: string;
  permissions: string[];
};
```

### 10.2. `POST /auth/login`

#### Request

```json
{
  "login": "admin",
  "password": "123456"
}
```

#### Response

```json
{
  "accessToken": "jwt-or-session-token",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "admin_1",
    "login": "admin",
    "name": "Администратор",
    "role": "admin",
    "permissions": ["tournament:create"]
  }
}
```

#### Notes

- `permissions` важны: фронт уже на них опирается
- `name` показывается в шапке
- `accessToken` фронт потом будет слать как `Authorization: Bearer <token>`

### 10.3. `GET /auth/me`

Нужен, чтобы после обновления страницы фронт мог проверить текущую сессию.

#### Response

```json
{
  "user": {
    "id": "admin_1",
    "login": "admin",
    "name": "Администратор",
    "role": "admin",
    "permissions": ["tournament:create"]
  }
}
```

### 10.4. `POST /auth/logout`

Опционально.

Если backend делает stateless JWT и logout не нужен, frontend может просто удалять токен локально.

### 10.5. Protected endpoints

Сейчас под auth должен попасть минимум:

- `POST /admin/tournaments/import`

Ожидаемые статусы:

- `401` если пользователь не залогинен
- `403` если залогинен, но не хватает permission

## 11. Admin tournament import API

---

### 11.1. `POST /admin/tournaments/import`

#### Auth

Требуется:

```text
Authorization: Bearer <token>
```

#### Content type

```text
multipart/form-data
```

#### Request fields

| Field | Тип | Обязательность | Комментарий |
|---|---|---|---|
| `date` | `string` | обязательно | `YYYY-MM-DD` |
| `cityId` | `string` | обязательно | должен существовать в справочнике |
| `clubId` | `string` | обязательно | должен принадлежать `cityId` |
| `tournamentType` | `daily \| tournament` | обязательно | тип турнира |
| `formatId` | `string` | обязательно | должен существовать в справочнике |
| `aetherhubUrl` | `string` | необязательно | сейчас просто сохраняем/валидируем |
| `finalStandingsFile` | `file` | обязательно | CSV итоговых стендингов |
| `allRoundsFile` | `file` | обязательно | CSV всех раундов |
| `playerDecksText` | `string` | обязательно | список строк формата `Игрок -> Колода` |

#### Minimal success response

```ts
type CreateTournamentResponse = {
  success: true;
  tournamentId: string;
  message: string;
  warnings?: string[];
};
```

#### Пример success

```json
{
  "success": true,
  "tournamentId": "tournament_2026_07_11_unicorn_legacy",
  "message": "Турнир успешно загружен.",
  "warnings": [
    "У двух игроков колоды не удалось сопоставить автоматически. Проверьте названия."
  ]
}
```

#### Что важно для frontend

- `message` показывается пользователю прямо на экране
- `warnings` тоже показываются пользователю как список
- `tournamentId` нужен минимум для подтверждения результата

#### Рекомендуемое расширение ответа

Frontend сейчас ещё не использует это, но backend лучше сразу предусмотреть:

```json
{
  "success": true,
  "tournamentId": "tournament_123",
  "message": "Турнир успешно загружен.",
  "warnings": [],
  "tournament": {
    "id": "tournament_123",
    "title": "Legacy Daily 11.07.2026"
  },
  "tournamentUrl": "/tournaments/tournament_123"
}
```

Это упростит следующий шаг, когда мы захотим после импорта сразу давать ссылку на созданный турнир.

### 11.2. Validation errors for import

Если форма заполнена неверно, нужен `422`.

#### Формат ошибки

```json
{
  "error": {
    "code": "IMPORT_VALIDATION_ERROR",
    "message": "Не удалось импортировать турнир.",
    "details": [
      {
        "field": "finalStandingsFile",
        "message": "Файл финальных стендингов не распознан.",
        "source": "body"
      },
      {
        "field": "playerDecksText",
        "message": "В строке 14 не удалось разобрать формат `Игрок -> Колода`.",
        "source": "body"
      }
    ]
  }
}
```

#### Какие `field` стоит поддержать

- `date`
- `cityId`
- `clubId`
- `tournamentType`
- `formatId`
- `aetherhubUrl`
- `finalStandingsFile`
- `allRoundsFile`
- `playerDecksText`

## 12. Error contract

Frontend уже ожидает единый формат:

```ts
type ApiErrorResponse = {
  error: {
    code?: string;
    message?: string;
    details?: Array<{
      field?: string;
      message: string;
      source?: string;
    }>;
  };
};
```

### 12.1. Recommended status codes

| Status | Когда использовать |
|---|---|
| `400` | некорректные query params, invalid date range, несуществующий filter id |
| `401` | неавторизованный доступ |
| `403` | нет нужного permission |
| `404` | не найден турнир / игрок / колода / route-сущность |
| `409` | конфликт импорта, если турнир уже существует |
| `422` | ошибки валидации формы импорта |
| `500` | внутренняя ошибка |

### 12.2. Error codes, которые уже логично поддержать

- `CITY_NOT_FOUND`
- `CLUB_NOT_FOUND`
- `CLUB_NOT_FOUND_IN_CITY`
- `FORMAT_NOT_FOUND`
- `INVALID_TOURNAMENT_TYPE`
- `INVALID_DATE_RANGE`
- `TOURNAMENT_NOT_FOUND`
- `PLAYER_NOT_FOUND`
- `DECK_NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `IMPORT_VALIDATION_ERROR`
- `TOURNAMENT_ALREADY_EXISTS`

## 13. Что backend должен отсортировать сам

Хотя frontend умеет сортировать таблицы на клиенте по клику, **начальный порядок массивов важен**.

Backend лучше сразу отдаёт:

- `GET /home -> recentTournaments` -> `date desc`
- `GET /home -> deckMetagame` -> популярность колоды
- `GET /home -> deckPerformance` -> лучшие результаты
- `GET /home -> topPlayers` -> лучшие результаты
- `GET /home -> popularMatchups` -> по частоте матчапа
- `GET /tournaments -> items` -> `date desc`
- `GET /tournaments/:id -> standings` -> `rank asc`
- `GET /tournaments/:id -> rounds` -> `roundNumber asc`
- `GET /players/:id -> tournaments` -> `date desc`
- `GET /decks/:id -> tournamentResults` -> `date desc`
- `GET /decks/:id -> matchups` -> `matchesCount desc`

## 14. Что можно отложить, но стоит предусмотреть

Это не блокирует текущий frontend, но скоро пригодится:

- import турнира только по `aetherhubUrl`, без ручной загрузки CSV;
- endpoint для refresh token, если auth будет через short-lived access token;
- admin endpoint для списка уже импортированных турниров;
- endpoint редактирования турнира после импорта;
- отдельные raw endpoints, если позже понадобится drill-down по матчам/стендингам без агрегатов.

## 15. Минимальный список API, после которого можно выключать mocks

Если коротко, вот обязательный MVP-набор:

- `POST /auth/login`
- `GET /auth/me`
- `GET /home`
- `GET /tournaments`
- `GET /tournaments/:id`
- `GET /players`
- `GET /players/:id`
- `GET /decks`
- `GET /decks/:id`
- `GET /cities`
- `GET /cities/:cityId/clubs`
- `GET /formats`
- `POST /admin/tournaments/import`

## 16. Резюме для backend

Главные технические требования:

- проценты в `0..100`, а не в `0..1`;
- `cityId=moscow` и `formatId=legacy` сейчас критичны для frontend defaults;
- `appliedFilters` нужны в ответах для отображения человеческих названий;
- все `id` должны быть стабильными и URL-safe;
- ошибки должны приходить в едином формате `{ error: { code, message, details } }`;
- ручка импорта должна быть защищена auth и принимать `multipart/form-data`;
- auth-ответ должен содержать `permissions`, минимум `tournament:create`.

Если backend реализует всё выше без отклонений по контракту, текущий frontend можно будет перевести с mocks на real API без переписывания структуры страниц.
