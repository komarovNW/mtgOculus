# MTG Global Stats MVP: API для списка турниров и страницы конкретного турнира

> [!WARNING]
> Архивный черновик API.
> Актуальный контракт для backend находится в `readme/BACKEND_API_HANDOFF.md`.
> Этот файл сохранён для истории и может расходиться с текущим фронтом.

## 1. Контекст

В MVP продукт публичный: пользователь может открыть веб-страницу без авторизации и посмотреть статистику по турнирам Magic: The Gathering.

Этот документ описывает API для двух сценариев:

1. Получить список турниров.
2. Получить данные конкретного турнира для страницы `/tournaments/:id`.

Важно: документ описывает **какие данные нужны фронту для отображения**, а не внутреннюю реализацию расчётов на backend. Backend сам решает, как хранить данные, как считать агрегаты и как получать их из БД.

---

## 2. Основные сущности

### Tournament

Турнир — это загруженное событие: дейлик или отдельный турнир.

Минимальные поля турнира для MVP:

```ts
Tournament {
  id: string
  title: string
  date: string // YYYY-MM-DD
  type: "daily" | "tournament"
  city: City
  club: Club
  format: Format
  playersCount: number
  roundsCount: number
  matchesCount: number
}
```

### City

```ts
City {
  id: string
  name: string
}
```

Пример:

```json
{
  "id": "moscow",
  "name": "Москва"
}
```

### Club

Клуб является отдельной сущностью. Названия клубов могут совпадать в разных городах, поэтому клуб должен быть связан с городом.

```ts
Club {
  id: string
  name: string
  cityId: string
}
```

Пример:

```json
{
  "id": "edinorog_moscow",
  "name": "Единорог",
  "cityId": "moscow"
}
```

### Format

Формат должен быть отдельной сущностью, потому что по нему будут фильтры и отдельная статистика.

```ts
Format {
  id: string
  name: string
}
```

Пример:

```json
{
  "id": "legacy",
  "name": "Legacy"
}
```

### Player short object

Все игроки, которые отображаются на фронте, должны приходить с `id`, потому что в будущем они будут кликабельными и вести на страницу игрока `/players/:id`.

```ts
PlayerShort {
  id: string
  name: string
}
```

### Deck short object

Все колоды, которые отображаются на фронте, должны приходить с `id`, потому что в будущем они будут кликабельными и вести на страницу колоды `/decks/:id`.

```ts
DeckShort {
  id: string
  name: string
  archetype?: string
  colors?: string[]
}
```

Пример:

```json
{
  "id": "deck_lands",
  "name": "Lands",
  "archetype": "Lands",
  "colors": ["G"]
}
```

---

## 3. Общие правила API

### Авторизация

Публичные ручки турниров в MVP не требуют авторизации.

```http
GET /api/v1/tournaments
GET /api/v1/tournaments/:id
```

### Формат дат

Все даты передаются в формате:

```text
YYYY-MM-DD
```

Пример:

```json
"2026-07-08"
```

### Проценты

Проценты backend отдаёт числом, а не строкой.

```json
{
  "omw": 58.33,
  "gw": 72.72,
  "ogw": 54.79
}
```

Фронт сам добавляет знак `%`.

### ID сущностей

В ответах обязательно должны быть стабильные `id` для:

- турниров;
- игроков;
- колод;
- города;
- клуба;
- формата.

Это нужно, чтобы в следующих этапах сделать переходы:

```text
/tournaments/:id
/players/:id
/decks/:id
```

---

## 4. Фильтрация турниров

Фильтры должны совпадать с основными полями, которые используются при создании турнира:

- город;
- клуб;
- формат;
- тип турнира;
- дата.

В MVP фронт может использовать дефолтный срез:

```text
cityId = moscow
formatId = legacy
clubId не передаётся, значит все клубы
```

Но API лучше сразу проектировать расширяемым.

### Поддерживаемые query params

```ts
TournamentListQuery {
  cityId?: string
  clubId?: string
  formatId?: string
  tournamentType?: "daily" | "tournament"
  dateFrom?: string // YYYY-MM-DD
  dateTo?: string // YYYY-MM-DD
  page?: number
  limit?: number
}
```

### Правила фильтрации

1. Если `cityId` передан, возвращаются турниры только из этого города.
2. Если `clubId` передан, возвращаются турниры только из этого клуба.
3. Если `clubId` передан вместе с `cityId`, backend должен проверить, что клуб относится к этому городу.
4. Если `formatId` передан, возвращаются турниры только этого формата.
5. Если `tournamentType` передан, возвращаются только дейлики или только турниры.
6. Если `dateFrom` и/или `dateTo` переданы, возвращаются турниры в этом диапазоне дат.
7. Если фильтры не переданы, backend может вернуть общий список турниров, но для MVP фронт будет передавать `cityId=moscow&formatId=legacy`.

---

## 5. GET /api/v1/tournaments

### Назначение

Используется для списка турниров и для перехода на страницу конкретного турнира.

В MVP этот список может использоваться:

- как отдельная страница турниров;
- как блок “Последние турниры” на главной;
- как источник для проверки, какие турниры уже загружены.

### Request

```http
GET /api/v1/tournaments?cityId=moscow&formatId=legacy&page=1&limit=20
```

### Query params

| Параметр | Тип | Обязательный | Описание |
|---|---:|---:|---|
| `cityId` | string | нет | Фильтр по городу |
| `clubId` | string | нет | Фильтр по клубу |
| `formatId` | string | нет | Фильтр по формату |
| `tournamentType` | `daily \| tournament` | нет | Тип турнира |
| `dateFrom` | string | нет | Дата от, формат `YYYY-MM-DD` |
| `dateTo` | string | нет | Дата до, формат `YYYY-MM-DD` |
| `page` | number | нет | Номер страницы |
| `limit` | number | нет | Количество элементов на странице |

### Response

```ts
TournamentListResponse {
  items: TournamentListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  appliedFilters: {
    city?: City
    club?: Club
    format?: Format
    tournamentType?: "daily" | "tournament"
    dateFrom?: string
    dateTo?: string
  }
}
```

```ts
TournamentListItem {
  id: string
  title: string
  date: string
  type: "daily" | "tournament"
  city: City
  club: Club
  format: Format
  playersCount: number
  roundsCount: number
  matchesCount: number
  winner?: {
    player: PlayerShort
    deck: DeckShort
  }
}
```

### Example response

```json
{
  "items": [
    {
      "id": "tournament_123",
      "title": "Legacy Daily 08.07.2026",
      "date": "2026-07-08",
      "type": "daily",
      "city": {
        "id": "moscow",
        "name": "Москва"
      },
      "club": {
        "id": "edinorog_moscow",
        "name": "Единорог",
        "cityId": "moscow"
      },
      "format": {
        "id": "legacy",
        "name": "Legacy"
      },
      "playersCount": 27,
      "roundsCount": 4,
      "matchesCount": 54,
      "winner": {
        "player": {
          "id": "player_terekhov_alexander",
          "name": "Терехов Александр"
        },
        "deck": {
          "id": "deck_lands",
          "name": "Lands"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "appliedFilters": {
    "city": {
      "id": "moscow",
      "name": "Москва"
    },
    "format": {
      "id": "legacy",
      "name": "Legacy"
    }
  }
}
```

### Empty state

Если турниров по фильтрам нет, backend возвращает `200 OK` и пустой массив.

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  },
  "appliedFilters": {
    "city": {
      "id": "moscow",
      "name": "Москва"
    },
    "format": {
      "id": "legacy",
      "name": "Legacy"
    }
  }
}
```

Фронт показывает текст:

```text
Пока нет турниров по выбранным фильтрам.
```

---

## 6. GET /api/v1/tournaments/:id

### Назначение

Используется для страницы конкретного турнира `/tournaments/:id`.

Страница турнира должна показать:

1. Header турнира.
2. Summary по турниру.
3. Финальные стендинги.
4. Все раунды/паринги.
5. Список игроков и их колод.
6. Метагейм турнира по колодам.

Для MVP можно вернуть всё одной ручкой. Если backend позже захочет оптимизировать, можно будет разделить на отдельные ручки:

```http
GET /api/v1/tournaments/:id/standings
GET /api/v1/tournaments/:id/rounds
GET /api/v1/tournaments/:id/decks
GET /api/v1/tournaments/:id/metagame
```

Но для первой версии предпочтительнее одна ручка.

### Request

```http
GET /api/v1/tournaments/tournament_123
```

### Response

```ts
TournamentDetailsResponse {
  tournament: TournamentDetails
  standings: TournamentStandingItem[]
  rounds: TournamentRound[]
  playerDecks: TournamentPlayerDeckItem[]
  metagame: TournamentMetagameItem[]
}
```

---

## 7. TournamentDetails

```ts
TournamentDetails {
  id: string
  title: string
  date: string
  type: "daily" | "tournament"
  city: City
  club: Club
  format: Format
  playersCount: number
  roundsCount: number
  matchesCount: number
  winner?: {
    player: PlayerShort
    deck: DeckShort
  }
}
```

### Example

```json
{
  "id": "tournament_123",
  "title": "Legacy Daily 08.07.2026",
  "date": "2026-07-08",
  "type": "daily",
  "city": {
    "id": "moscow",
    "name": "Москва"
  },
  "club": {
    "id": "edinorog_moscow",
    "name": "Единорог",
    "cityId": "moscow"
  },
  "format": {
    "id": "legacy",
    "name": "Legacy"
  },
  "playersCount": 27,
  "roundsCount": 4,
  "matchesCount": 54,
  "winner": {
    "player": {
      "id": "player_terekhov_alexander",
      "name": "Терехов Александр"
    },
    "deck": {
      "id": "deck_lands",
      "name": "Lands"
    }
  }
}
```

---

## 8. Финальные стендинги

### Назначение

Используется для таблицы итоговых мест турнира.

Фронт отображает:

```text
Место | Игрок | Колода | Результат | Очки | OMW | GW | OGW
```

Игрок и колода должны быть кликабельными в будущем.

### Type

```ts
TournamentStandingItem {
  rank: number
  player: PlayerShort
  deck: DeckShort
  record: string
  points: number
  matchWins: number
  matchLosses: number
  matchDraws: number
  omw?: number
  gw?: number
  ogw?: number
}
```

### Example

```json
{
  "rank": 1,
  "player": {
    "id": "player_terekhov_alexander",
    "name": "Терехов Александр"
  },
  "deck": {
    "id": "deck_lands",
    "name": "Lands"
  },
  "record": "4-0",
  "points": 12,
  "matchWins": 4,
  "matchLosses": 0,
  "matchDraws": 0,
  "omw": 58.33,
  "gw": 72.72,
  "ogw": 54.79
}
```

### Notes

- `record` нужен фронту для простого отображения.
- `matchWins`, `matchLosses`, `matchDraws` нужны для сортировок/будущих виджетов.
- `omw`, `gw`, `ogw` могут отсутствовать, если в источнике нет tiebreakers.

---

## 9. Раунды / паринги

### Назначение

Используется для отображения всех матчей турнира по раундам.

Фронт отображает:

```text
Раунд 1
Стол | Игрок A | Колода A | Счёт | Игрок B | Колода B
```

### Type

```ts
TournamentRound {
  roundNumber: number
  matches: TournamentRoundMatch[]
}
```

```ts
TournamentRoundMatch {
  tableNumber: number
  playerA: TournamentMatchPlayer
  playerB: TournamentMatchPlayer
  scoreText: string
  winnerPlayerId?: string
}
```

```ts
TournamentMatchPlayer {
  id: string
  name: string
  deck: DeckShort
  score: number
}
```

### Example

```json
{
  "roundNumber": 1,
  "matches": [
    {
      "tableNumber": 1,
      "playerA": {
        "id": "player_volkov_maxim",
        "name": "Волков Максим",
        "deck": {
          "id": "deck_bg_order",
          "name": "BG Order"
        },
        "score": 1
      },
      "playerB": {
        "id": "player_radchenko_fedor",
        "name": "Радченко Фёдор",
        "deck": {
          "id": "deck_uw_phelia",
          "name": "UW Phelia"
        },
        "score": 2
      },
      "scoreText": "1-2",
      "winnerPlayerId": "player_radchenko_fedor"
    }
  ]
}
```

### Notes

- `tableNumber` — номер пары/стола внутри конкретного раунда.
- `tableNumber` не является уникальным во всём турнире. Уникальность: `tournamentId + roundNumber + tableNumber`.
- `scoreText` нужен фронту для простого отображения.
- `winnerPlayerId` может отсутствовать, если матч закончился вничью.

---

## 10. Список игроков и колод турнира

### Назначение

Используется для отдельной вкладки/блока “Колоды турнира”.

Фронт отображает:

```text
Игрок | Колода
```

Эта таблица нужна, чтобы быстро посмотреть, кто на чём играл, без tiebreakers и раундов.

### Type

```ts
TournamentPlayerDeckItem {
  player: PlayerShort
  deck: DeckShort
  rank?: number
  record?: string
}
```

### Example

```json
{
  "player": {
    "id": "player_terekhov_alexander",
    "name": "Терехов Александр"
  },
  "deck": {
    "id": "deck_lands",
    "name": "Lands"
  },
  "rank": 1,
  "record": "4-0"
}
```

---

## 11. Метагейм турнира

### Назначение

Используется для блока распределения колод внутри конкретного турнира.

Фронт отображает:

```text
Колода | Игроков | Доля | Лучшее место
```

### Type

```ts
TournamentMetagameItem {
  deck: DeckShort
  playersCount: number
  metaShare: number
  bestRank: number
}
```

### Example

```json
{
  "deck": {
    "id": "deck_ub_tempo",
    "name": "UB Tempo",
    "archetype": "Tempo",
    "colors": ["U", "B"]
  },
  "playersCount": 3,
  "metaShare": 11.11,
  "bestRank": 22
}
```

### Notes

- `metaShare` отдаётся числом в процентах.
- Фронт сам добавляет знак `%`.
- В MVP можно сортировать по `playersCount desc`, затем `bestRank asc`.

---

## 12. Full example response: GET /api/v1/tournaments/:id

```json
{
  "tournament": {
    "id": "tournament_123",
    "title": "Legacy Daily 08.07.2026",
    "date": "2026-07-08",
    "type": "daily",
    "city": {
      "id": "moscow",
      "name": "Москва"
    },
    "club": {
      "id": "edinorog_moscow",
      "name": "Единорог",
      "cityId": "moscow"
    },
    "format": {
      "id": "legacy",
      "name": "Legacy"
    },
    "playersCount": 27,
    "roundsCount": 4,
    "matchesCount": 54,
    "winner": {
      "player": {
        "id": "player_terekhov_alexander",
        "name": "Терехов Александр"
      },
      "deck": {
        "id": "deck_lands",
        "name": "Lands"
      }
    }
  },
  "standings": [
    {
      "rank": 1,
      "player": {
        "id": "player_terekhov_alexander",
        "name": "Терехов Александр"
      },
      "deck": {
        "id": "deck_lands",
        "name": "Lands"
      },
      "record": "4-0",
      "points": 12,
      "matchWins": 4,
      "matchLosses": 0,
      "matchDraws": 0,
      "omw": 58.33,
      "gw": 72.72,
      "ogw": 54.79
    }
  ],
  "rounds": [
    {
      "roundNumber": 1,
      "matches": [
        {
          "tableNumber": 1,
          "playerA": {
            "id": "player_volkov_maxim",
            "name": "Волков Максим",
            "deck": {
              "id": "deck_bg_order",
              "name": "BG Order"
            },
            "score": 1
          },
          "playerB": {
            "id": "player_radchenko_fedor",
            "name": "Радченко Фёдор",
            "deck": {
              "id": "deck_uw_phelia",
              "name": "UW Phelia"
            },
            "score": 2
          },
          "scoreText": "1-2",
          "winnerPlayerId": "player_radchenko_fedor"
        }
      ]
    }
  ],
  "playerDecks": [
    {
      "player": {
        "id": "player_terekhov_alexander",
        "name": "Терехов Александр"
      },
      "deck": {
        "id": "deck_lands",
        "name": "Lands"
      },
      "rank": 1,
      "record": "4-0"
    }
  ],
  "metagame": [
    {
      "deck": {
        "id": "deck_lands",
        "name": "Lands"
      },
      "playersCount": 1,
      "metaShare": 3.7,
      "bestRank": 1
    }
  ]
}
```

---

## 13. Error responses

### Tournament not found

```http
404 Not Found
```

```json
{
  "error": {
    "code": "TOURNAMENT_NOT_FOUND",
    "message": "Турнир не найден."
  }
}
```

### Invalid filter in tournaments list

```http
400 Bad Request
```

```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "Некорректный фильтр clubId: клуб не относится к выбранному городу."
  }
}
```

---

## 14. Frontend rendering plan

### Страница списка турниров

Маршрут:

```text
/tournaments
```

Блоки:

1. Фильтры: город, клуб, формат, тип турнира, дата.
2. Таблица/карточки турниров.
3. Empty state, если турниров нет.

Таблица:

```text
Дата | Название | Тип | Город | Клуб | Формат | Игроков | Победитель | Колода
```

### Страница конкретного турнира

Маршрут:

```text
/tournaments/:id
```

Блоки:

1. Header турнира.
2. Summary cards.
3. Вкладка Standings.
4. Вкладка Rounds.
5. Вкладка Decks.
6. Вкладка Metagame.

Минимальный MVP страницы турнира:

```text
Header
Standings
Rounds
Player decks
```

Metagame можно добавить сразу, если backend уже может вернуть эти данные.

---

## 15. Что важно заложить на будущее

### 1. Кликабельность сущностей

Все игроки и колоды должны приходить с `id`, даже если страницы игрока и колоды ещё не реализованы.

В будущем:

```text
player.id -> /players/:id
deck.id -> /decks/:id
```

### 2. Разделение одной ручки на несколько

Для MVP `GET /api/v1/tournaments/:id` может возвращать всё сразу.

Если ответ станет большим, можно будет разделить:

```http
GET /api/v1/tournaments/:id
GET /api/v1/tournaments/:id/standings
GET /api/v1/tournaments/:id/rounds
GET /api/v1/tournaments/:id/decks
GET /api/v1/tournaments/:id/metagame
```

### 3. Top cut

В MVP top cut не нужен. В будущем можно добавить:

```ts
TopCutMatch {
  stage: "quarterfinal" | "semifinal" | "final"
  playerA: TournamentMatchPlayer
  playerB: TournamentMatchPlayer
  scoreText: string
  winnerPlayerId: string
}
```

### 4. Источник турнира

В MVP турниры добавляются вручную через CSV.

В будущем турнир может быть создан по ссылке AetherHub:

```text
https://aetherhub.com/Tourney/RoundTourney/100523
```

Это не должно менять публичный API страницы турнира.

---

## 16. MVP scope

В MVP по турнирам нужно сделать:

1. `GET /api/v1/tournaments` — список турниров с фильтрами.
2. `GET /api/v1/tournaments/:id` — данные конкретного турнира.
3. В ответах отдавать стабильные `id` турниров, игроков и колод.
4. Страница турнира должна уметь показать:
   - header;
   - финальные стендинги;
   - раунды/паринги;
   - список игрок → колода;
   - метагейм турнира по колодам, если backend может вернуть его без существенного усложнения.

Не входит в MVP:

1. Top cut.
2. Decklists.
3. Авторизация пользователя.
4. Редактирование турнира.
5. Комментарии и ручная модерация на странице турнира.
6. Подробная статистика матчапов внутри турнира отдельной вкладкой.
