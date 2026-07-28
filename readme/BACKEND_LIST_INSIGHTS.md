# Требования к «Быстрому ориентиру»

## Задача

Frontend загружает списки частями по 50 строк. Сейчас некоторые показатели
«Быстрого ориентира» считаются только по загруженным строкам и поэтому могут быть
неверными.

От backend нужны готовые показатели по всей найденной выборке для:

- `GET /api/v1/tournaments`;
- `GET /api/v1/players`;
- `GET /api/v1/decks`.

Способ расчёта и внутренняя реализация остаются на усмотрение backend.

## Общие требования

- В ответе каждого списка нужен объект `insights`.
- `insights` учитывает те же фильтры и поиск, что и список.
- `insights` считается по всем найденным данным, а не только по текущей странице.
- `page` и `page_size` не меняют значения `insights`.
- Переход на следующую страницу не должен менять «Быстрый ориентир».
- При пустой выборке лидеры равны `null`, счётчики равны `0`.
- Объект лидера имеет ту же структуру, что соответствующая строка `results`.
- Добавление `insights` не должно менять существующие поля списка.
- В строках и агрегатах турниров нужны отдельные `playedMatchesCount`,
  `byesCount` и `unknownResultsCount`.
- В строках игроков `matchesCount` включает подтверждённые BYE, а
  `playedMatchesCount` — только игры с реальным оппонентом.
- В строках колод `playedMatchesCount`, record и winrate не включают BYE и
  неизвестные результаты.
- Отсутствующий оппонент без явного `isBye: true` не считается BYE.

Ожидаемая верхнеуровневая структура:

```json
{
  "count": 0,
  "next": null,
  "previous": null,
  "appliedFilters": {},
  "insights": {},
  "results": []
}
```

## Турниры

### `GET /api/v1/tournaments`

Нужные поля:

```json
{
  "insights": {
    "latestTournament": null,
    "biggestTournament": null
  }
}
```

Требования:

- `latestTournament` — самое позднее событие по дате;
- если даты совпали, выше событие с большим `id`;
- `biggestTournament` — событие с наибольшим `playersCount`;
- при равном `playersCount` сравниваются `playedMatchesCount`, затем дата, затем
  `id`;
- оба показателя учитывают все переданные фильтры, включая `tournamentType`.

## Игроки

### `GET /api/v1/players`

Нужные поля:

```json
{
  "insights": {
    "leader": null,
    "stablePlayersCount": 0
  }
}
```

Требования:

- `leader` — первый игрок полной выборки с учётом переданных `sort` и `order`;
- `search` влияет и на `leader`, и на `stablePlayersCount`;
- `stablePlayersCount` — количество игроков, у которых
  `isSmallSample = false`;
- при одинаковых значениях порядок должен быть стабильным.

## Колоды

### `GET /api/v1/decks`

Нужные поля:

```json
{
  "insights": {
    "mostPopularDeck": null,
    "bestPerformingDeck": null,
    "stableDecksCount": 0
  }
}
```

Требования:

- `mostPopularDeck` определяется по `playersCount`;
- при равном `playersCount` сравниваются `playedMatchesCount`, затем название;
- `bestPerformingDeck` выбирается только среди колод с
  `isSmallSample = false`;
- для `bestPerformingDeck` сравниваются `matchWinRate`, затем
  `playedMatchesCount`, затем `playersCount`, затем название;
- `stableDecksCount` — количество колод с `isSmallSample = false`;
- `search` влияет на все три показателя;
- сортировка таблицы не меняет смысл этих трёх показателей.

## Готово, когда

- [ ] Все три списка возвращают `insights`.
- [ ] На первой, второй и последней странице одного запроса `insights`
      одинаковы.
- [ ] Лидер определяется правильно, даже если его нет на первой странице.
- [ ] Фильтры и поиск пересчитывают показатели.
- [ ] Пустой результат возвращает `200`, пустой `results`, `null` для лидеров и
      `0` для счётчиков.
- [ ] Равные значения всегда дают стабильный результат.
