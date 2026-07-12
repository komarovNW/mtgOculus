# MTG Global Stats MVP — Decks API

> [!WARNING]
> Архивный черновик API.
> Актуальный контракт для backend находится в `readme/BACKEND_API_HANDOFF.md`.
> Этот файл сохранён для истории и может расходиться с текущим фронтом.

Документ описывает API для экранов **списка колод** и **конкретной колоды** в MVP веб-приложения со статистикой Magic: The Gathering турниров.

Фокус документа — какие данные нужны фронту для отображения экранов. Backend сам решает, как именно агрегировать данные, считать winrate, связывать турниры, игроков и колоды.

---

## 1. Контекст

В продукте есть три основные публичные сущности:

- турнир;
- игрок;
- колода.

Экран колоды нужен, чтобы пользователь мог открыть конкретную колоду и посмотреть:

- как часто она встречалась;
- сколько турниров и матчей сыграно этой колодой;
- какой у неё winrate;
- какие игроки играли этой колодой;
- какие результаты она показывала на турнирах;
- против каких колод она играла и с каким результатом.

В MVP экран может быть простым. Главное — сразу заложить стабильные `deckId`, чтобы на колоду можно было ссылаться из главной страницы, страницы турнира и страницы игрока.

---

## 2. Авторизация

Публичные экраны колод не требуют авторизации.

```http
GET /api/v1/decks
GET /api/v1/decks/:id
```

---

## 3. Фильтры

Фильтры должны быть такими же, как сущности, которые используются при создании турнира.

### Поддерживаемые query params

```text
cityId?
clubId?
formatId?
tournamentType?
dateFrom?
dateTo?
```

### Описание фильтров

| Параметр | Тип | Обязательный | Описание |
|---|---|---:|---|
| `cityId` | string | нет | Фильтр по городу |
| `clubId` | string | нет | Фильтр по клубу внутри города |
| `formatId` | string | нет | Фильтр по формату, например `legacy` |
| `tournamentType` | `daily \| tournament` | нет | Фильтр по типу турнира |
| `dateFrom` | string | нет | Начало периода, формат `YYYY-MM-DD` |
| `dateTo` | string | нет | Конец периода, формат `YYYY-MM-DD` |

### MVP-дефолт

В MVP фронт может открывать экраны с дефолтным срезом:

```text
cityId = moscow
formatId = legacy
clubId не передаётся, значит все клубы
```

Пример:

```http
GET /api/v1/decks?cityId=moscow&formatId=legacy
GET /api/v1/decks/deck_lands?cityId=moscow&formatId=legacy
```

В будущем фронт сможет дать пользователю интерфейс фильтрации по этим же параметрам.

---

## 4. Важное требование по идентификаторам

Backend должен возвращать стабильный внутренний `deckId`.

Нельзя полагаться только на строковое название колоды, потому что одна и та же колода может быть записана по-разному:

```text
UB Tempo
UB tempo
Dimir Tempo
U/B Tempo
```

Поэтому во всех ответах колода должна приходить объектом:

```json
{
  "id": "deck_ub_tempo",
  "name": "UB Tempo"
}
```

Дополнительные поля вроде `archetype` и `colors` можно отдавать, если они уже есть в базе. Если пока не готовы — можно не отдавать или отдавать `null`.

---

## 5. GET /api/v1/decks

Ручка возвращает список колод для экрана списка колод.

### Назначение

Фронт показывает таблицу/список колод по выбранному срезу.

Пользователь должен видеть:

- название колоды;
- формат;
- количество турниров, где колода встречалась;
- количество игроко-участий на колоде;
- количество матчей;
- общий record;
- winrate;
- лучшее место.

### Request

```http
GET /api/v1/decks?cityId=moscow&formatId=legacy&page=1&limit=50
```

### Query params

| Параметр | Тип | Обязательный | Описание |
|---|---|---:|---|
| `cityId` | string | нет | Фильтр по городу |
| `clubId` | string | нет | Фильтр по клубу |
| `formatId` | string | нет | Фильтр по формату |
| `tournamentType` | `daily \| tournament` | нет | Фильтр по типу турнира |
| `dateFrom` | string | нет | Начало периода |
| `dateTo` | string | нет | Конец периода |
| `page` | number | нет | Номер страницы |
| `limit` | number | нет | Размер страницы |
| `sort` | string | нет | Поле сортировки |

### Возможные значения sort

Для MVP можно поддержать минимум:

```text
playersCount_desc
matchWinRate_desc
matchesCount_desc
bestRank_asc
name_asc
```

Если `sort` не передан, рекомендуемый дефолт:

```text
playersCount_desc
```

### Response

```json
{
  "items": [
    {
      "deck": {
        "id": "deck_lands",
        "name": "Lands",
        "archetype": "Lands",
        "colors": ["G", "R"]
      },
      "format": {
        "id": "legacy",
        "name": "Legacy"
      },
      "tournamentsCount": 3,
      "playersCount": 5,
      "matchesCount": 20,
      "matchWins": 12,
      "matchLosses": 8,
      "matchDraws": 0,
      "matchWinRate": 60.0,
      "bestRank": 1,
      "isSmallSample": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1
  }
}
```

### DeckListItem

```ts
DeckListItem {
  deck: {
    id: string
    name: string
    archetype?: string | null
    colors?: string[] | null
  }

  format: {
    id: string
    name: string
  }

  tournamentsCount: number
  playersCount: number
  matchesCount: number

  matchWins: number
  matchLosses: number
  matchDraws: number
  matchWinRate: number

  bestRank?: number | null
  isSmallSample: boolean
}
```

### Пояснения по полям

| Поле | Описание |
|---|---|
| `tournamentsCount` | Сколько турниров содержали эту колоду |
| `playersCount` | Сколько игроко-участий было на этой колоде |
| `matchesCount` | Сколько матчей сыграно этой колодой |
| `matchWins/matchLosses/matchDraws` | Матчевый record колоды |
| `matchWinRate` | Процент побед по матчам |
| `bestRank` | Лучшее место этой колоды в выбранном срезе |
| `isSmallSample` | Флаг малой выборки |

### Small sample

Для MVP backend может выставлять:

```text
isSmallSample = true, если matchesCount < 5
```

Точное правило можно поменять позже.

---

## 6. GET /api/v1/decks/:id

Ручка возвращает все данные для страницы конкретной колоды.

### Назначение

Фронт открывает страницу колоды по `deckId` и показывает:

- header колоды;
- summary;
- результаты колоды на турнирах;
- игроков, которые играли этой колодой;
- матчапы колоды.

### Request

```http
GET /api/v1/decks/deck_lands?cityId=moscow&formatId=legacy
```

### Response

```json
{
  "deck": {
    "id": "deck_lands",
    "name": "Lands",
    "archetype": "Lands",
    "colors": ["G", "R"],
    "format": {
      "id": "legacy",
      "name": "Legacy"
    }
  },
  "appliedFilters": {
    "city": {
      "id": "moscow",
      "name": "Москва"
    },
    "club": null,
    "format": {
      "id": "legacy",
      "name": "Legacy"
    },
    "tournamentType": null,
    "dateFrom": null,
    "dateTo": null
  },
  "summary": {
    "tournamentsCount": 3,
    "playersCount": 5,
    "uniquePlayersCount": 4,
    "matchesCount": 20,
    "matchWins": 12,
    "matchLosses": 8,
    "matchDraws": 0,
    "matchWinRate": 60.0,
    "bestRank": 1,
    "isSmallSample": false
  },
  "tournamentResults": [
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
          "id": "club_edinorog_moscow",
          "name": "Единорог"
        },
        "format": {
          "id": "legacy",
          "name": "Legacy"
        },
        "playersCount": 27
      },
      "player": {
        "id": "player_terehov_alexander",
        "name": "Терехов Александр"
      },
      "rank": 1,
      "record": "4-0",
      "points": 12
    }
  ],
  "players": [
    {
      "player": {
        "id": "player_terehov_alexander",
        "name": "Терехов Александр"
      },
      "tournamentsCount": 2,
      "matchesCount": 8,
      "matchWins": 7,
      "matchLosses": 1,
      "matchDraws": 0,
      "matchWinRate": 87.5,
      "bestRank": 1,
      "isSmallSample": false
    }
  ],
  "matchups": [
    {
      "opponentDeck": {
        "id": "deck_ub_tempo",
        "name": "UB Tempo",
        "archetype": "Tempo",
        "colors": ["U", "B"]
      },
      "matchesCount": 5,
      "wins": 3,
      "losses": 2,
      "draws": 0,
      "winRate": 60.0,
      "isSmallSample": false
    }
  ]
}
```

---

## 7. Структура страницы конкретной колоды

### 7.1 Header

Фронт показывает:

```text
Lands
Формат: Legacy
Архетип: Lands
Цвета: G/R
```

Если `archetype` или `colors` отсутствуют, фронт может их не показывать.

---

### 7.2 Summary cards

Фронт показывает карточки:

```text
Турниров: 3
Игроко-участий: 5
Уникальных игроков: 4
Матчей: 20
Record: 12-8-0
Winrate: 60.0%
Лучшее место: 1
```

### DeckSummary

```ts
DeckSummary {
  tournamentsCount: number
  playersCount: number
  uniquePlayersCount: number
  matchesCount: number

  matchWins: number
  matchLosses: number
  matchDraws: number
  matchWinRate: number

  bestRank?: number | null
  isSmallSample: boolean
}
```

---

### 7.3 Результаты по турнирам

Таблица:

```text
Дата | Турнир | Город | Клуб | Игрок | Место | Результат | Очки
```

### TournamentDeckResultItem

```ts
TournamentDeckResultItem {
  tournament: {
    id: string
    title: string
    date: string
    type: "daily" | "tournament"
    city: {
      id: string
      name: string
    }
    club: {
      id: string
      name: string
    }
    format: {
      id: string
      name: string
    }
    playersCount: number
  }

  player: {
    id: string
    name: string
  }

  rank: number
  record: string
  points: number
}
```

Кликабельные сущности:

- `tournament.id` → `/tournaments/:id`
- `player.id` → `/players/:id`

---

### 7.4 Игроки на колоде

Таблица:

```text
Игрок | Турниров | Матчей | Record | Winrate | Лучшее место
```

### DeckPlayerItem

```ts
DeckPlayerItem {
  player: {
    id: string
    name: string
  }

  tournamentsCount: number
  matchesCount: number
  matchWins: number
  matchLosses: number
  matchDraws: number
  matchWinRate: number
  bestRank?: number | null
  isSmallSample: boolean
}
```

Кликабельные сущности:

- `player.id` → `/players/:id`

---

### 7.5 Матчапы колоды

Для MVP этот блок можно зафиксировать, но не обязательно делать в первой версии страницы.

Таблица:

```text
Против колоды | Матчей | Record | Winrate
```

### DeckMatchupItem

```ts
DeckMatchupItem {
  opponentDeck: {
    id: string
    name: string
    archetype?: string | null
    colors?: string[] | null
  }

  matchesCount: number
  wins: number
  losses: number
  draws: number
  winRate: number
  isSmallSample: boolean
}
```

Кликабельные сущности:

- `opponentDeck.id` → `/decks/:id`

---

## 8. MVP scope

### Входит в MVP для списка колод

```text
GET /api/v1/decks
```

Поля:

- deck id/name;
- format;
- tournamentsCount;
- playersCount;
- matchesCount;
- match record;
- matchWinRate;
- bestRank;
- isSmallSample.

### Входит в MVP для страницы колоды

```text
GET /api/v1/decks/:id
```

Блоки:

- header;
- summary;
- tournamentResults;
- players.

### Можно добавить позже

- matchups;
- график динамики популярности колоды по времени;
- результаты по архетипам;
- decklists;
- версии колоды внутри одного архетипа;
- сравнение двух колод;
- фильтрация по минимальному количеству матчей.

---

## 9. Empty states

### Список колод пустой

Если по выбранным фильтрам нет данных:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 0
  }
}
```

Фронт показывает:

```text
По выбранным фильтрам пока нет колод.
```

### Страница колоды без данных в выбранном срезе

Если колода существует, но по фильтрам нет результатов, backend может вернуть deck + пустую статистику:

```json
{
  "deck": {
    "id": "deck_lands",
    "name": "Lands",
    "format": {
      "id": "legacy",
      "name": "Legacy"
    }
  },
  "summary": {
    "tournamentsCount": 0,
    "playersCount": 0,
    "uniquePlayersCount": 0,
    "matchesCount": 0,
    "matchWins": 0,
    "matchLosses": 0,
    "matchDraws": 0,
    "matchWinRate": 0,
    "bestRank": null,
    "isSmallSample": true
  },
  "tournamentResults": [],
  "players": [],
  "matchups": []
}
```

Фронт показывает:

```text
По выбранным фильтрам у этой колоды пока нет результатов.
```

---

## 10. Ошибки

### Deck not found

Если `deckId` не существует:

```http
404 Not Found
```

```json
{
  "error": {
    "code": "DECK_NOT_FOUND",
    "message": "Колода не найдена."
  }
}
```

### Invalid filters

Если передан несуществующий город, клуб или формат:

```http
400 Bad Request
```

```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "Некорректный фильтр.",
    "details": [
      {
        "field": "formatId",
        "message": "Формат не найден."
      }
    ]
  }
}
```

---

## 11. Требования к совместимости с другими экранами

Колоды должны быть кликабельными из следующих мест:

- главный экран;
- список турниров;
- страница турнира;
- страница игрока;
- список игроков, если показывается mostPlayedDeck.

Поэтому во всех API, где отображается колода, backend должен возвращать минимум:

```ts
DeckShort {
  id: string
  name: string
}
```

Расширенная версия:

```ts
DeckShort {
  id: string
  name: string
  archetype?: string | null
  colors?: string[] | null
}
```

---

## 12. Что backend не обязан делать в MVP

В MVP backend не обязан:

- отдавать decklists;
- рассчитывать сложный рейтинг силы колоды;
- объединять версии колоды на уровне API;
- делать сравнение колод;
- показывать динамику меты по времени;
- поддерживать авторизацию для публичного просмотра.

Главная задача MVP — дать фронту стабильные данные для отображения списка колод и страницы конкретной колоды.
