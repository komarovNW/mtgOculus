# MTG Global Stats MVP — API для экрана игроков и конкретного игрока

## 1. Контекст

Этот документ описывает API, которое нужно frontend-части MVP для отображения:

1. списка игроков;
2. страницы конкретного игрока.

Страницы публичные. Авторизация для просмотра не требуется.

В MVP основной дефолтный срез продукта:

- город: Москва;
- клуб: любой;
- формат: Legacy;
- тип турнира: любой;
- период: все доступные данные или период, который frontend передаст явно.

Важно: backend сам решает, как считать статистику. Этот документ описывает только то, какие данные нужны frontend для отрисовки экранов.

---

## 2. Общие принципы

### 2.1. Все сущности должны возвращаться с id

Игроки, турниры, колоды, города, клубы и форматы должны приходить не просто строками, а объектами с `id` и `name/title`.

Это нужно, чтобы frontend мог строить переходы:

```text
/players/:id
/tournaments/:id
/decks/:id
```

Пример:

```json
{
  "player": {
    "id": "player_123",
    "name": "Терехов Александр"
  }
}
```

### 2.2. Фильтры должны быть совместимы с главной страницей

Фильтры для списка игроков и страницы игрока должны совпадать по смыслу с фильтрами главного экрана и создания турнира:

- `cityId`;
- `clubId`;
- `formatId`;
- `tournamentType`;
- `dateFrom`;
- `dateTo`.

В MVP frontend может всегда передавать:

```http
cityId=moscow&formatId=legacy
```

Но API лучше сразу сделать расширяемым.

### 2.3. Winrate нельзя показывать без количества матчей

Frontend должен получать не только `matchWinRate`, но и количество матчей/побед/поражений/ничьих.

Плохой вариант:

```json
{
  "matchWinRate": 100
}
```

Хороший вариант:

```json
{
  "matchesCount": 4,
  "matchWins": 3,
  "matchLosses": 1,
  "matchDraws": 0,
  "matchWinRate": 75.0,
  "isSmallSample": true
}
```

`isSmallSample` нужен, чтобы frontend мог визуально помечать статистику на малой выборке.

---

## 3. Экран списка игроков

### 3.1. Назначение экрана

Экран списка игроков нужен, чтобы пользователь мог:

- посмотреть всех игроков в выбранном срезе;
- найти конкретного игрока;
- сравнить игроков по базовой статистике;
- перейти на страницу конкретного игрока.

### 3.2. Ручка

```http
GET /api/v1/players
```

### 3.3. Query params

```text
cityId?: string
clubId?: string
formatId?: string
tournamentType?: "daily" | "tournament"
dateFrom?: string // YYYY-MM-DD
dateTo?: string   // YYYY-MM-DD
search?: string
sort?: "matchWinRate" | "matchesCount" | "tournamentsCount" | "bestRank" | "name"
order?: "asc" | "desc"
page?: number
limit?: number
```

### 3.4. MVP-вызов

```http
GET /api/v1/players?cityId=moscow&formatId=legacy&page=1&limit=50
```

### 3.5. Response

```ts
PlayersListResponse {
  appliedFilters: AppliedFilters
  pagination: Pagination
  items: PlayerListItem[]
}
```

```ts
AppliedFilters {
  city?: {
    id: string
    name: string
  }
  club?: {
    id: string
    name: string
  }
  format?: {
    id: string
    name: string
  }
  tournamentType?: "daily" | "tournament"
  dateFrom?: string
  dateTo?: string
}
```

```ts
Pagination {
  page: number
  limit: number
  total: number
  hasMore: boolean
}
```

```ts
PlayerListItem {
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

  bestRank?: number

  mostPlayedDeck?: {
    id: string
    name: string
  }

  isSmallSample: boolean
}
```

### 3.6. Пример ответа

```json
{
  "appliedFilters": {
    "city": {
      "id": "moscow",
      "name": "Москва"
    },
    "format": {
      "id": "legacy",
      "name": "Legacy"
    }
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "hasMore": false
  },
  "items": [
    {
      "player": {
        "id": "player_terekhov_alexander",
        "name": "Терехов Александр"
      },
      "tournamentsCount": 2,
      "matchesCount": 8,
      "matchWins": 7,
      "matchLosses": 1,
      "matchDraws": 0,
      "matchWinRate": 87.5,
      "bestRank": 1,
      "mostPlayedDeck": {
        "id": "deck_lands",
        "name": "Lands"
      },
      "isSmallSample": false
    },
    {
      "player": {
        "id": "player_komarov_nikita",
        "name": "Комаров Никита"
      },
      "tournamentsCount": 1,
      "matchesCount": 4,
      "matchWins": 1,
      "matchLosses": 3,
      "matchDraws": 0,
      "matchWinRate": 25.0,
      "bestRank": 33,
      "mostPlayedDeck": {
        "id": "deck_mardu_ajani",
        "name": "Mardu Ajani"
      },
      "isSmallSample": true
    }
  ]
}
```

### 3.7. Empty state

Если игроков в выбранном срезе нет, backend возвращает `200 OK` и пустой массив:

```json
{
  "appliedFilters": {
    "city": {
      "id": "moscow",
      "name": "Москва"
    },
    "format": {
      "id": "legacy",
      "name": "Legacy"
    }
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 0,
    "hasMore": false
  },
  "items": []
}
```

Frontend показывает текст:

```text
Пока нет игроков по выбранным фильтрам.
```

---

## 4. Экран конкретного игрока

### 4.1. Назначение экрана

Страница игрока нужна, чтобы пользователь мог посмотреть:

- общую статистику игрока;
- турниры, в которых он участвовал;
- колоды, которыми он играл;
- в дальнейшем — историю матчей.

### 4.2. Ручка

```http
GET /api/v1/players/:id
```

### 4.3. Query params

```text
cityId?: string
clubId?: string
formatId?: string
tournamentType?: "daily" | "tournament"
dateFrom?: string // YYYY-MM-DD
dateTo?: string   // YYYY-MM-DD
```

### 4.4. MVP-вызов

```http
GET /api/v1/players/player_terekhov_alexander?cityId=moscow&formatId=legacy
```

### 4.5. Response

```ts
PlayerDetailsResponse {
  appliedFilters: AppliedFilters
  player: PlayerDetails
  summary: PlayerSummary
  tournaments: PlayerTournamentItem[]
  decks: PlayerDeckItem[]
  recentMatches?: PlayerMatchItem[]
}
```

---

## 5. Блок `player`

```ts
PlayerDetails {
  id: string
  name: string
}
```

Пример:

```json
{
  "id": "player_terekhov_alexander",
  "name": "Терехов Александр"
}
```

В будущем сюда можно добавить:

```ts
aliases?: string[]
city?: string
avatarUrl?: string
```

Но для MVP эти поля не нужны.

---

## 6. Блок `summary`

### 6.1. Назначение

Summary показывает общую статистику игрока в выбранном срезе фильтров.

### 6.2. Контракт

```ts
PlayerSummary {
  tournamentsCount: number
  matchesCount: number
  matchWins: number
  matchLosses: number
  matchDraws: number
  matchWinRate: number

  gameWins?: number
  gameLosses?: number
  gameDraws?: number
  gameWinRate?: number

  bestRank?: number
  averageRank?: number

  uniqueDecksCount: number
  isSmallSample: boolean
}
```

### 6.3. Пример

```json
{
  "tournamentsCount": 2,
  "matchesCount": 8,
  "matchWins": 7,
  "matchLosses": 1,
  "matchDraws": 0,
  "matchWinRate": 87.5,
  "gameWins": 14,
  "gameLosses": 5,
  "gameDraws": 0,
  "gameWinRate": 73.7,
  "bestRank": 1,
  "averageRank": 4.5,
  "uniqueDecksCount": 1,
  "isSmallSample": false
}
```

### 6.4. Что frontend отрисовывает

Карточки:

```text
Турниров
Матчей
Record
Match Winrate
Game Winrate, если есть
Лучшее место
Колоды
```

Record frontend может собрать из полей:

```text
matchWins-matchLosses-matchDraws
```

Например:

```text
7-1-0
```

---

## 7. Блок `tournaments`

### 7.1. Назначение

Показывает турниры, в которых участвовал игрок.

### 7.2. Таблица на frontend

```text
Дата | Турнир | Город | Клуб | Формат | Колода | Место | Игроков | Record | Очки
```

### 7.3. Контракт

```ts
PlayerTournamentItem {
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

  deck: {
    id: string
    name: string
    archetype?: string
    colors?: string[]
  }

  rank: number
  record: string
  points: number

  omw?: number
  gw?: number
  ogw?: number
}
```

### 7.4. Пример

```json
{
  "tournament": {
    "id": "tournament_2026_07_08_legacy_unicorn",
    "title": "Legacy Daily 08.07.2026",
    "date": "2026-07-08",
    "type": "daily",
    "city": {
      "id": "moscow",
      "name": "Москва"
    },
    "club": {
      "id": "edinorog_moscow",
      "name": "Единорог"
    },
    "format": {
      "id": "legacy",
      "name": "Legacy"
    },
    "playersCount": 27
  },
  "deck": {
    "id": "deck_lands",
    "name": "Lands",
    "archetype": "Lands",
    "colors": ["G", "R"]
  },
  "rank": 1,
  "record": "4-0",
  "points": 12,
  "omw": 58.33,
  "gw": 72.72,
  "ogw": 54.79
}
```

---

## 8. Блок `decks`

### 8.1. Назначение

Показывает, какими колодами играл игрок в выбранном срезе.

### 8.2. Таблица на frontend

```text
Колода | Турниров | Матчей | Record | Winrate | Лучшее место
```

### 8.3. Контракт

```ts
PlayerDeckItem {
  deck: {
    id: string
    name: string
    archetype?: string
    colors?: string[]
  }

  tournamentsCount: number
  matchesCount: number
  matchWins: number
  matchLosses: number
  matchDraws: number
  matchWinRate: number
  bestRank?: number
  isSmallSample: boolean
}
```

### 8.4. Пример

```json
{
  "deck": {
    "id": "deck_lands",
    "name": "Lands",
    "archetype": "Lands",
    "colors": ["G", "R"]
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
```

---

## 9. Блок `recentMatches` — не обязателен для MVP

### 9.1. Статус

Этот блок можно зафиксировать в контракте как будущий, но не делать в первой версии.

Если backend пока не готов отдавать матчи игрока, поле можно не возвращать или возвращать пустым массивом.

### 9.2. Назначение

Показывает последние матчи игрока.

### 9.3. Таблица на frontend

```text
Дата | Турнир | Раунд | Колода игрока | Оппонент | Колода оппонента | Счёт | Результат
```

### 9.4. Контракт

```ts
PlayerMatchItem {
  tournament: {
    id: string
    title: string
    date: string
    format: {
      id: string
      name: string
    }
  }

  roundNumber: number
  tableNumber: number

  playerDeck: {
    id: string
    name: string
  }

  opponent: {
    id: string
    name: string
  }

  opponentDeck: {
    id: string
    name: string
  }

  playerScore: number
  opponentScore: number
  scoreText: string
  result: "win" | "loss" | "draw"
}
```

### 9.5. Пример

```json
{
  "tournament": {
    "id": "tournament_2026_07_08_legacy_unicorn",
    "title": "Legacy Daily 08.07.2026",
    "date": "2026-07-08",
    "format": {
      "id": "legacy",
      "name": "Legacy"
    }
  },
  "roundNumber": 1,
  "tableNumber": 1,
  "playerDeck": {
    "id": "deck_lands",
    "name": "Lands"
  },
  "opponent": {
    "id": "player_radchenko_fedor",
    "name": "Радченко Фёдор"
  },
  "opponentDeck": {
    "id": "deck_uw_phelia",
    "name": "UW Phelia"
  },
  "playerScore": 2,
  "opponentScore": 1,
  "scoreText": "2-1",
  "result": "win"
}
```

---

## 10. Полный пример `GET /api/v1/players/:id`

```json
{
  "appliedFilters": {
    "city": {
      "id": "moscow",
      "name": "Москва"
    },
    "format": {
      "id": "legacy",
      "name": "Legacy"
    }
  },
  "player": {
    "id": "player_terekhov_alexander",
    "name": "Терехов Александр"
  },
  "summary": {
    "tournamentsCount": 2,
    "matchesCount": 8,
    "matchWins": 7,
    "matchLosses": 1,
    "matchDraws": 0,
    "matchWinRate": 87.5,
    "gameWins": 14,
    "gameLosses": 5,
    "gameDraws": 0,
    "gameWinRate": 73.7,
    "bestRank": 1,
    "averageRank": 4.5,
    "uniqueDecksCount": 1,
    "isSmallSample": false
  },
  "tournaments": [
    {
      "tournament": {
        "id": "tournament_2026_07_08_legacy_unicorn",
        "title": "Legacy Daily 08.07.2026",
        "date": "2026-07-08",
        "type": "daily",
        "city": {
          "id": "moscow",
          "name": "Москва"
        },
        "club": {
          "id": "edinorog_moscow",
          "name": "Единорог"
        },
        "format": {
          "id": "legacy",
          "name": "Legacy"
        },
        "playersCount": 27
      },
      "deck": {
        "id": "deck_lands",
        "name": "Lands",
        "archetype": "Lands",
        "colors": ["G", "R"]
      },
      "rank": 1,
      "record": "4-0",
      "points": 12,
      "omw": 58.33,
      "gw": 72.72,
      "ogw": 54.79
    }
  ],
  "decks": [
    {
      "deck": {
        "id": "deck_lands",
        "name": "Lands",
        "archetype": "Lands",
        "colors": ["G", "R"]
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
  "recentMatches": []
}
```

---

## 11. Ошибки

### 11.1. Игрок не найден

```http
404 Not Found
```

```json
{
  "error": {
    "code": "PLAYER_NOT_FOUND",
    "message": "Игрок не найден."
  }
}
```

### 11.2. Некорректный фильтр

```http
400 Bad Request
```

```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "Передан некорректный formatId."
  }
}
```

---

## 12. Empty state для страницы конкретного игрока

Если игрок существует, но по выбранным фильтрам у него нет турниров, backend возвращает `200 OK`:

```json
{
  "appliedFilters": {
    "city": {
      "id": "moscow",
      "name": "Москва"
    },
    "format": {
      "id": "legacy",
      "name": "Legacy"
    }
  },
  "player": {
    "id": "player_terekhov_alexander",
    "name": "Терехов Александр"
  },
  "summary": {
    "tournamentsCount": 0,
    "matchesCount": 0,
    "matchWins": 0,
    "matchLosses": 0,
    "matchDraws": 0,
    "matchWinRate": 0,
    "bestRank": null,
    "averageRank": null,
    "uniqueDecksCount": 0,
    "isSmallSample": true
  },
  "tournaments": [],
  "decks": [],
  "recentMatches": []
}
```

Frontend показывает:

```text
У игрока пока нет турниров по выбранным фильтрам.
```

---

## 13. Что входит в MVP

Для MVP достаточно реализовать:

```text
GET /api/v1/players
GET /api/v1/players/:id
```

На странице игрока обязательно нужны блоки:

```text
1. Header игрока
2. Summary
3. Турниры игрока
4. Колоды игрока
```

Блок `recentMatches` можно не делать в первой версии, но контракт можно оставить как расширение.

---

## 14. Что можно добавить позже

Позже можно расширить экран игрока:

```text
1. История всех матчей игрока.
2. Матчапы игрока против колод.
3. Статистика по клубам.
4. Статистика по городам.
5. Статистика по форматам.
6. График изменения результатов по времени.
7. Сравнение двух игроков.
8. Публичный профиль игрока с аватаркой.
9. Подтверждение профиля игроком через авторизацию.
```

---

## 15. Важные требования для backend

1. `playerId` — это внутренний id нашей системы, а не id из парсера/AetherHub.
2. Все данные должны фильтроваться по тем же сущностям, что и главный экран: город, клуб, формат, тип турнира, период.
3. Ответы должны содержать id сущностей для будущих переходов.
4. Если данных нет, это не ошибка. Нужно возвращать пустые массивы и нулевые summary.
5. Если игрок не найден вообще, это `404 PLAYER_NOT_FOUND`.
6. `matchWinRate` должен приходить вместе с количеством матчей и record-полями.
7. Для малой выборки нужно возвращать `isSmallSample`.
