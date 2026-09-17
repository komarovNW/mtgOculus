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
  /** Дата последнего турнира в текущем срезе, YYYY-MM-DD. */
  lastTournamentDate?: string | null;
  /**
   * Число турниров, где игрок прошёл все запланированные раунды
   * без поражений и ничьих. Досрочно выбывшие игроки не учитываются.
   */
  undefeatedTopsCount?: number | null;
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

`summary.undefeatedTopsCount` — число турниров текущего среза, в которых игрок
прошёл все запланированные раунды без поражений и ничьих. Досрочно выбывшие
игроки не учитываются. Frontend не восстанавливает этот показатель через
дополнительные запросы турниров.

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
историю матчей выбранного среза. Неполная история явно отмечается и не заменяет
агрегаты из `summary`. BYE должны приходить отдельными строками с `isBye: true`:
они показываются в истории раундов и объясняют разницу между числом результатов
и реально сыгранных матчей.

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

Параметр `search` должен искать по названию колоды без учёта регистра.
Фильтрация применяется до пагинации: `results`, общее количество элементов и
признак следующей страницы относятся только к найденным колодам.

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

`summary.metaShare` — опциональная доля всех участий колод в выбранном срезе,
которая приходится на эту колоду, в шкале 0–100. Если поле отсутствует,
frontend не загружает весь список колод для самостоятельного пересчёта и не
показывает пустую карточку.

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

## Матрица матчапов

### `GET /matchups`

Контракт отдельного раздела `/matchups`. Проверен с работающим API 06.09.2026,
включая ответ 40×40. Это подключённый endpoint, а не запрос на его разработку.

Ручной выбор пока не поддерживается: `deckIds` игнорируется текущим API.
Расширение описано отдельно как новая задача в
[BACKEND_MATCHUP_SELECTION.md](BACKEND_MATCHUP_SELECTION.md).

| Параметр | Обязательный | Значение |
|---|---|---|
| `formatId` | да | code одного формата |
| `cityId`, `clubId` | нет | code города и клуба |
| `dateFrom`, `dateTo` | нет | `YYYY-MM-DD` |
| `tournamentType` | нет | `daily` или `tournament` |
| `top` | нет | целое 2–40, по умолчанию 15 |

```ts
type MatrixStats = {
  matchesCount: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number | null;
  winRateLow: number | null;
  winRateHigh: number | null;
  isSmallSample: boolean;
};
type MatrixDeck = {
  id: number;
  name: string;
  archetype?: string | null;
  colors?: string | string[] | null;
};
type MatrixResponse = {
  decks: MatrixDeck[];
  rows: {
    deck: MatrixDeck;
    metaShare: number;
    mirrorMatches: number;
    overall: MatrixStats | null;
    cells: (MatrixStats | null)[];
  }[];
  appliedFilters?: AppliedFilters | null;
};
```

`decks` задаёт порядок обеих осей; `rows` сопоставляются по `deck.id`,
а `cells[i]` относится к `decks[i]`. Число строк и ячеек в каждой строке
совпадает с числом колод. `null` допустим и фактически встречается в ответе,
включая диагональ; Swagger-пример не показывает эту nullable-возможность.
`colors` в реальном ответе может быть `null`; frontend также принимает строку
с кодами цветов (`UB`) и массив кодов.

Проценты передаются в шкале 0–100. `overall` описывает всё поле выбранного
среза и не пересчитывается по видимым ячейкам. Зеркальные матчи не входят
в процент побед; их число передаётся отдельно в `mirrorMatches`.
`isSmallSample` и границы доверительного интервала используются как есть.
Уровень доверия в контракте не указан, поэтому UI не подписывает интервал
как 95%. Обратные значения при ничьих не восстанавливаются из соседней ячейки.

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
  "warnings": [
    {
      "code": "PLAYER_NAME_NORMALIZED",
      "message": "Имя сопоставлено с существующим игроком.",
      "source": "playerDecksText"
    }
  ]
}
```

Backend должен валидировать входные данные, ограничивать размер и частоту
запросов и не возвращать внутренние ошибки или stack traces.

Если импорт нельзя завершить, ответ содержит все найденные ошибки и
неблокирующие предупреждения:

```json
{
  "success": false,
  "errors": [
    {
      "code": "INVALID_MATCH_SCORE",
      "message": "Некорректный счёт матча в раунде 5, столе 11.",
      "source": "allRoundsFile",
      "roundNumber": 5,
      "tableNumber": 11,
      "rawValue": "2-1-1"
    }
  ],
  "warnings": []
}
```

Frontend показывает пользователю `message` каждой ошибки и предупреждения.
`source` используется для понятной привязки сообщения к части импортируемых
данных.

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

### Общий обзор главной без фильтров

Frontend поддерживает опциональное поле `overview` в ответе `GET /api/v1/home`.
Оно нужно только для полностью общего среза без `cityId`, `clubId`, `formatId`,
`tournamentType`, `dateFrom` и `dateTo`. Все значения рассчитывает backend до
пагинации; frontend их только отображает.

```json
{
  "overview": {
    "cities": [{
      "city": { "id": "moscow", "name": "Москва" },
      "clubsCount": 3,
      "dailiesCount": 120,
      "tournamentsCount": 4,
      "uniquePlayersCount": 180,
      "averagePlayersCount": 14.2,
      "formatsCount": 4
    }],
    "clubs": [{
      "club": { "id": "portal_moscow", "name": "Портал", "cityId": "moscow" },
      "city": { "id": "moscow", "name": "Москва" },
      "dailiesCount": 52,
      "tournamentsCount": 2,
      "uniquePlayersCount": 96,
      "averagePlayersCount": 15.4,
      "formatsCount": 3
    }],
    "formats": [{
      "format": { "id": "legacy", "name": "Legacy" },
      "dailiesCount": 80,
      "tournamentsCount": 3,
      "tournamentPlayersCount": 1120,
      "uniquePlayersCount": 142,
      "averagePlayersCount": 13.5,
      "lastTournamentDate": "2026-09-16"
    }],
    "cityFormats": [{
      "city": { "id": "moscow", "name": "Москва" },
      "leadingFormat": { "id": "legacy", "name": "Legacy" },
      "participationShare": 44.5,
      "otherFormats": [
        { "id": "pauper", "name": "Pauper" }
      ]
    }]
  }
}
```

Правила расчёта:

- `uniquePlayersCount` — уникальные игроки внутри конкретного города, клуба или
  формата, а не сумма уникальных игроков по отдельным турнирам;
- `averagePlayersCount` — число участий, делённое на суммарное количество
  дейликов и турниров соответствующего среза;
- `participationShare` — доля участий ведущего формата среди всех участий в
  городе;
- `otherFormats` сортируются по числу участий по убыванию;
- города, клубы и форматы без загруженных результатов можно не включать;
- массивы сортируются по числу участий по убыванию, при равенстве — по имени.

До появления `overview` frontend продолжает показывать существующую общую
сводку и последние дейлики/турниры. Дополнительных каскадных запросов и
клиентского пересчёта этих показателей нет.

Проверка отдельных production-ответов от 2026-09-05 обнаружила отклонения от
требований выше: поиск колод игнорируется, `topPlayers` главной не учитывает
продуктовый порог, summary и история игрока используют несогласованный набор.
Измерения и действующие обходные решения: [PROJECT_AUDIT.md](PROJECT_AUDIT.md).

Поле `insights` для глобальных агрегатов ещё не является частью обязательного
действующего контракта. Все открытые backend-задачи, включая агрегаты,
корректность данных и пагинацию, собраны в
[BACKEND_DATA_ACCURACY.md](BACKEND_DATA_ACCURACY.md).

В том же документе добавлены приоритеты и предложения по компактным сводкам,
пагинации вкладок, сравнению периодов, покрытию и свежести данных. Это будущие
контракты: существующий frontend не отправляет запросы на эти новые paths.

Раздел `/digest` сейчас не требует backend API. До появления реального процесса
подготовки и публикации статей не нужно проектировать CMS, список материалов или
ручки детальной статьи.
