# MTG Global Stats — MVP API для основного публичного экрана

> [!WARNING]
> Архивный черновик API.
> Актуальный контракт для backend находится в `readme/BACKEND_API_HANDOFF.md`.
> Этот файл сохранён для истории и может расходиться с текущим фронтом.

## 1. Цель документа

Документ описывает API для основного публичного экрана MVP веб-приложения статистики Magic: The Gathering.

Экран публичный: пользователь может открыть страницу без авторизации.

На MVP этапе основной экран показывает статистику по дефолтному срезу:

- город: Москва;
- клуб: любой;
- формат: Legacy;
- тип турнира: любой;
- период: все загруженные турниры или дефолтный период, если backend решит ограничить выборку.

При этом API сразу должно быть спроектировано так, чтобы в будущем пользователь мог фильтровать статистику по тем же основным сущностям, которые используются при создании турнира:

- город;
- клуб;
- формат;
- тип турнира;
- дата / период.

Фронт на этом экране не должен сам считать статистику из сырых турниров и матчей. Backend должен вернуть уже подготовленные данные для отображения блоков главной страницы.

---

## 2. Основной пользовательский сценарий MVP

1. Пользователь открывает главную страницу сайта.
2. Авторизация не требуется.
3. Фронт вызывает API главного экрана с дефолтными фильтрами:

```http
GET /api/v1/home?cityId=moscow&formatId=legacy
```

4. Backend возвращает агрегированные данные для блоков экрана.
5. Фронт отображает:
   - summary cards;
   - последние турниры;
   - метагейм по колодам;
   - результативность колод;
   - топ игроков;
   - популярные матчапы.

---

## 3. Важный принцип по фильтрации

Фильтры основного экрана должны соответствовать данным, которые указываются при создании турнира.

При создании турнира указываются:

- `date`;
- `cityId`;
- `clubId`;
- `tournamentType`;
- `formatId`.

Значит, основной экран должен быть готов фильтровать статистику по этим же полям:

- `cityId` — город;
- `clubId` — клуб внутри выбранного города;
- `formatId` — формат;
- `tournamentType` — дейлик / турнир;
- `dateFrom` / `dateTo` — период.

В MVP фронт может использовать только дефолтные значения `cityId=moscow` и `formatId=legacy`, но backend-контракт лучше сразу заложить расширяемым.

---

## 4. Рекомендуемые фильтры

### 4.1. MVP-фильтры, которые фронт использует сразу

```text
cityId=moscow
formatId=legacy
```

`clubId` не передаётся — значит, включаются все клубы выбранного города.

`tournamentType` не передаётся — значит, включаются все типы турниров.

`dateFrom` и `dateTo` не передаются — значит, используется весь доступный период или дефолт backend.

### 4.2. Фильтры для будущего развития

```text
cityId
clubId
formatId
tournamentType
dateFrom
dateTo
```

Дополнительно позже можно добавить:

```text
minMatches
minPlayers
limit
```

Но для первого MVP это не обязательно.

---

## 5. API справочников для будущих фильтров

Эти ручки уже могут использоваться на экране создания турнира. Основной экран в будущем может использовать те же справочники для фильтров.

### 5.1. Получить список городов

```http
GET /api/v1/cities
```

Пример ответа:

```json
{
  "items": [
    {
      "id": "moscow",
      "name": "Москва",
      "country": "Россия"
    },
    {
      "id": "saint-petersburg",
      "name": "Санкт-Петербург",
      "country": "Россия"
    }
  ]
}
```

### 5.2. Получить список клубов по городу

```http
GET /api/v1/cities/:cityId/clubs
```

Пример:

```http
GET /api/v1/cities/moscow/clubs
```

Пример ответа:

```json
{
  "items": [
    {
      "id": "edinorog_moscow",
      "name": "Единорог",
      "cityId": "moscow"
    },
    {
      "id": "goldfish_moscow",
      "name": "GoldFish",
      "cityId": "moscow"
    }
  ]
}
```

Важно: название клуба не является глобально уникальным. Одинаковые названия клубов в разных городах допустимы. Уникальность клуба должна определяться через `cityId + clubId` или внутренний `clubId`.

### 5.3. Получить список форматов

```http
GET /api/v1/formats
```

Пример ответа:

```json
{
  "items": [
    {
      "id": "legacy",
      "name": "Legacy"
    },
    {
      "id": "modern",
      "name": "Modern"
    },
    {
      "id": "pioneer",
      "name": "Pioneer"
    }
  ]
}
```

### 5.4. Типы турниров

Для MVP можно не делать отдельную ручку, а держать enum на фронте:

```ts
TournamentType = "daily" | "tournament"
```

Отображение:

```text
daily — Дейлик
tournament — Турнир
```

Если backend хочет полностью управлять справочниками, можно добавить ручку:

```http
GET /api/v1/tournament-types
```

---

## 6. Основная ручка главного экрана

```http
GET /api/v1/home
```

### 6.1. Query params

| Параметр | Тип | Обязательный | MVP default | Описание |
|---|---:|---:|---|---|
| `cityId` | string | да для MVP | `moscow` | Город, по которому строится статистика |
| `formatId` | string | да для MVP | `legacy` | Формат MTG |
| `clubId` | string | нет | не передаётся | Если не передан, статистика строится по всем клубам выбранного города |
| `tournamentType` | `daily` \| `tournament` | нет | не передаётся | Если не передан, учитываются все типы турниров |
| `dateFrom` | string, `YYYY-MM-DD` | нет | не передаётся | Начало периода |
| `dateTo` | string, `YYYY-MM-DD` | нет | не передаётся | Конец периода |

### 6.2. MVP-вызов

```http
GET /api/v1/home?cityId=moscow&formatId=legacy
```

### 6.3. Будущий вызов с фильтрами

```http
GET /api/v1/home?cityId=moscow&clubId=edinorog_moscow&formatId=legacy&tournamentType=daily&dateFrom=2026-07-01&dateTo=2026-07-31
```

---

## 7. Структура ответа

```ts
HomeResponse {
  appliedFilters: HomeAppliedFilters
  summary: HomeSummary
  recentTournaments: RecentTournamentItem[]
  deckMetagame: DeckMetagameItem[]
  deckPerformance: DeckPerformanceItem[]
  topPlayers: TopPlayerItem[]
  popularMatchups: PopularMatchupItem[]
}
```

---

## 8. Applied filters

Backend должен возвращать применённые фильтры, чтобы фронт мог явно показать пользователю, по какому срезу построена статистика.

```ts
HomeAppliedFilters {
  city: {
    id: string
    name: string
  }
  club?: {
    id: string
    name: string
  }
  format: {
    id: string
    name: string
  }
  tournamentType?: "daily" | "tournament"
  dateFrom?: string
  dateTo?: string
}
```

Пример для MVP:

```json
{
  "city": {
    "id": "moscow",
    "name": "Москва"
  },
  "format": {
    "id": "legacy",
    "name": "Legacy"
  }
}
```

Пример для будущего с фильтрами:

```json
{
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
  "tournamentType": "daily",
  "dateFrom": "2026-07-01",
  "dateTo": "2026-07-31"
}
```

---

## 9. Summary cards

Summary cards — верхние карточки с общими числами по текущему срезу.

```ts
HomeSummary {
  tournamentsCount: number
  tournamentPlayersCount: number
  uniquePlayersCount: number
  matchesCount: number
  uniqueDecksCount: number
}
```

Описание полей:

| Поле | Описание |
|---|---|
| `tournamentsCount` | Количество турниров в выбранном срезе |
| `tournamentPlayersCount` | Количество участий игроков в турнирах. Один игрок в трёх турнирах = 3 участия |
| `uniquePlayersCount` | Количество уникальных игроков |
| `matchesCount` | Количество матчей |
| `uniqueDecksCount` | Количество уникальных колод |

Пример:

```json
{
  "tournamentsCount": 5,
  "tournamentPlayersCount": 128,
  "uniquePlayersCount": 73,
  "matchesCount": 240,
  "uniqueDecksCount": 26
}
```

---

## 10. Последние турниры

Блок нужен, чтобы пользователь видел, какие турниры уже загружены в систему, и мог перейти на страницу конкретного турнира.

```ts
RecentTournamentItem {
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
  roundsCount: number
  winner?: {
    player: {
      id: string
      name: string
    }
    deck: {
      id: string
      name: string
    }
  }
}
```

Пример:

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
    "name": "Единорог"
  },
  "format": {
    "id": "legacy",
    "name": "Legacy"
  },
  "playersCount": 27,
  "roundsCount": 4,
  "winner": {
    "player": {
      "id": "player_terehov_alexander",
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

## 11. Метагейм по колодам

Блок показывает популярность колод в выбранном срезе.

Рекомендуемое отображение на фронте:

- таблица;
- горизонтальная bar chart для top-10 колод по популярности.

```ts
DeckMetagameItem {
  deck: {
    id: string
    name: string
    archetype?: string
    colors?: string[]
  }
  playersCount: number
  tournamentsCount: number
  metaShare: number
  bestRank?: number
}
```

Описание полей:

| Поле | Описание |
|---|---|
| `playersCount` | Количество участий игроков на этой колоде |
| `tournamentsCount` | В скольких турнирах встречалась колода |
| `metaShare` | Доля колоды в метагейме в процентах |
| `bestRank` | Лучшее место колоды в выбранном срезе |

Пример:

```json
{
  "deck": {
    "id": "deck_ub_tempo",
    "name": "UB Tempo",
    "archetype": "Tempo",
    "colors": ["U", "B"]
  },
  "playersCount": 5,
  "tournamentsCount": 2,
  "metaShare": 12.5,
  "bestRank": 2
}
```

---

## 12. Результативность колод

Блок показывает, какие колоды показывают хорошие результаты по матчам.

Рекомендуемое отображение:

```text
Колода | Матчей | Record | Winrate | Лучшее место
```

```ts
DeckPerformanceItem {
  deck: {
    id: string
    name: string
    archetype?: string
    colors?: string[]
  }
  matchesCount: number
  matchWins: number
  matchLosses: number
  matchDraws: number
  matchWinRate: number
  bestRank?: number
  isSmallSample: boolean
}
```

`matchWinRate` отдаётся числом в процентах.

`isSmallSample` нужен, чтобы фронт мог пометить статистику как малую выборку. Например, если у колоды меньше 5 матчей.

Пример:

```json
{
  "deck": {
    "id": "deck_lands",
    "name": "Lands",
    "archetype": "Lands",
    "colors": ["G"]
  },
  "matchesCount": 18,
  "matchWins": 11,
  "matchLosses": 7,
  "matchDraws": 0,
  "matchWinRate": 61.1,
  "bestRank": 1,
  "isSmallSample": false
}
```

---

## 13. Топ игроков

Блок показывает лучших игроков по выбранному срезу.

Рекомендуемое отображение:

```text
Игрок | Турниров | Матчей | Record | Winrate | Лучший результат | Основная колода
```

```ts
TopPlayerItem {
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

`isSmallSample` нужен, чтобы не вводить пользователя в заблуждение, если у игрока слишком мало матчей.

Пример:

```json
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
  "mostPlayedDeck": {
    "id": "deck_lands",
    "name": "Lands"
  },
  "isSmallSample": false
}
```

---

## 14. Популярные матчапы

Блок показывает самые частые матчапы между колодами.

Рекомендуемое отображение:

```text
Матчап | Матчей | Победы Deck A | Победы Deck B | Winrate Deck A
```

```ts
PopularMatchupItem {
  deckA: {
    id: string
    name: string
  }
  deckB: {
    id: string
    name: string
  }
  matchesCount: number
  deckAWins: number
  deckBWins: number
  draws: number
  deckAWinRate: number
  isSmallSample: boolean
}
```

Пример:

```json
{
  "deckA": {
    "id": "deck_ub_tempo",
    "name": "UB Tempo"
  },
  "deckB": {
    "id": "deck_lands",
    "name": "Lands"
  },
  "matchesCount": 5,
  "deckAWins": 2,
  "deckBWins": 3,
  "draws": 0,
  "deckAWinRate": 40,
  "isSmallSample": false
}
```

---

## 15. Полный пример ответа

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
  "summary": {
    "tournamentsCount": 5,
    "tournamentPlayersCount": 128,
    "uniquePlayersCount": 73,
    "matchesCount": 240,
    "uniqueDecksCount": 26
  },
  "recentTournaments": [
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
        "name": "Единорог"
      },
      "format": {
        "id": "legacy",
        "name": "Legacy"
      },
      "playersCount": 27,
      "roundsCount": 4,
      "winner": {
        "player": {
          "id": "player_terehov_alexander",
          "name": "Терехов Александр"
        },
        "deck": {
          "id": "deck_lands",
          "name": "Lands"
        }
      }
    }
  ],
  "deckMetagame": [
    {
      "deck": {
        "id": "deck_ub_tempo",
        "name": "UB Tempo",
        "archetype": "Tempo",
        "colors": ["U", "B"]
      },
      "playersCount": 5,
      "tournamentsCount": 2,
      "metaShare": 12.5,
      "bestRank": 2
    }
  ],
  "deckPerformance": [
    {
      "deck": {
        "id": "deck_lands",
        "name": "Lands"
      },
      "matchesCount": 18,
      "matchWins": 11,
      "matchLosses": 7,
      "matchDraws": 0,
      "matchWinRate": 61.1,
      "bestRank": 1,
      "isSmallSample": false
    }
  ],
  "topPlayers": [
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
      "mostPlayedDeck": {
        "id": "deck_lands",
        "name": "Lands"
      },
      "isSmallSample": false
    }
  ],
  "popularMatchups": [
    {
      "deckA": {
        "id": "deck_ub_tempo",
        "name": "UB Tempo"
      },
      "deckB": {
        "id": "deck_lands",
        "name": "Lands"
      },
      "matchesCount": 5,
      "deckAWins": 2,
      "deckBWins": 3,
      "draws": 0,
      "deckAWinRate": 40,
      "isSmallSample": false
    }
  ]
}
```

---

## 16. Empty state

Если по выбранным фильтрам нет данных, API не должно возвращать ошибку.

Нужно вернуть пустые массивы и нулевой summary.

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
  "summary": {
    "tournamentsCount": 0,
    "tournamentPlayersCount": 0,
    "uniquePlayersCount": 0,
    "matchesCount": 0,
    "uniqueDecksCount": 0
  },
  "recentTournaments": [],
  "deckMetagame": [],
  "deckPerformance": [],
  "topPlayers": [],
  "popularMatchups": []
}
```

Фронт в этом случае показывает empty state:

```text
Пока нет загруженных турниров по выбранным фильтрам.
```

---

## 17. Ошибки

### 17.1. Невалидный город

```http
GET /api/v1/home?cityId=unknown&formatId=legacy
```

```json
{
  "error": {
    "code": "CITY_NOT_FOUND",
    "message": "Город не найден."
  }
}
```

### 17.2. Невалидный формат

```json
{
  "error": {
    "code": "FORMAT_NOT_FOUND",
    "message": "Формат не найден."
  }
}
```

### 17.3. Клуб не принадлежит выбранному городу

```json
{
  "error": {
    "code": "CLUB_NOT_FOUND_IN_CITY",
    "message": "Клуб не найден в выбранном городе."
  }
}
```

### 17.4. Невалидный тип турнира

```json
{
  "error": {
    "code": "INVALID_TOURNAMENT_TYPE",
    "message": "Некорректный тип турнира."
  }
}
```

### 17.5. Невалидный период

```json
{
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "Некорректный период фильтрации."
  }
}
```

---

## 18. Что не входит в MVP главного экрана

В первый MVP не входит:

- авторизация пользователя;
- персональные рекомендации;
- сложный рейтинг игроков;
- Elo / power ranking;
- сравнение городов;
- сравнение клубов;
- график изменения меты по неделям;
- decklists;
- sideboard data;
- отдельная страница матчапов;
- отдельная страница глобального рейтинга.

---

## 19. Что можно добавить позже

После MVP можно расширить главный экран:

- фильтры в UI;
- отдельный выбор периода;
- отдельный фильтр по клубу;
- отдельный фильтр по типу турнира;
- отдельную страницу `/matchups`;
- отдельную страницу `/players`;
- отдельную страницу `/decks`;
- динамику метагейма по датам;
- сравнение меты по городам;
- сравнение клубов;
- расширенную статистику архетипов;
- статистику по цветам;
- top conversion;
- отображение малой выборки более явно.

---

## 20. Итоговое решение для MVP

Для основного экрана MVP нужна одна публичная ручка:

```http
GET /api/v1/home?cityId=moscow&formatId=legacy
```

Она должна вернуть все данные, необходимые для рендера главного экрана:

- применённые фильтры;
- summary cards;
- последние турниры;
- метагейм по колодам;
- результативность колод;
- топ игроков;
- популярные матчапы.

Фронт в MVP использует дефолтный срез `Москва + Legacy`, но API должно сразу поддерживать расширяемую фильтрацию по тем же сущностям, которые указываются при создании турнира: город, клуб, формат, тип турнира и дата.
