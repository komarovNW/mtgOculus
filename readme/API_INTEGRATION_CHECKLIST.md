# API Integration Checklist

## Цель документа

Этот чеклист нужен для этапа подключения frontend к backend. Агент должен пройти его после того, как базовые страницы будут работать на mock-данных.

## Общие проверки

- [ ] `.env.example` создан.
- [ ] `.env.local` поддерживает `VITE_API_BASE_URL`.
- [ ] `.env.local` поддерживает `VITE_USE_MOCKS`.
- [ ] При `VITE_USE_MOCKS=true` сайт работает без backend.
- [ ] При `VITE_USE_MOCKS=false` сайт делает реальные API-запросы.
- [ ] Все API-запросы идут через единый API client.
- [ ] Ошибки API не ломают весь сайт.
- [ ] Loading state есть на всех страницах.
- [ ] Empty state есть на всех страницах.
- [ ] Error state есть на всех страницах.

## Dictionaries

### Cities

Endpoint:

```http
GET /api/v1/cities
```

Проверки:

- [ ] список городов загружается;
- [ ] город отображается в фильтрах;
- [ ] город отображается на форме создания турнира;
- [ ] при пустом списке городов показывается корректное состояние.

### Clubs

Endpoint:

```http
GET /api/v1/cities/:cityId/clubs
```

Проверки:

- [ ] клубы загружаются после выбора города;
- [ ] клубы фильтруются по cityId;
- [ ] если клубов нет, показывается empty state;
- [ ] clubId отправляется при создании турнира.

### Formats

Endpoint:

```http
GET /api/v1/formats
```

Проверки:

- [ ] список форматов загружается;
- [ ] Legacy доступен как формат;
- [ ] formatId отправляется в запросах фильтрации;
- [ ] formatId отправляется при создании турнира.

## Home page

Endpoint:

```http
GET /api/v1/home?cityId=moscow&formatId=legacy
```

Проверки:

- [ ] главная страница открывается по `/`;
- [ ] summary cards отображаются;
- [ ] recent tournaments отображаются;
- [ ] deck metagame отображается;
- [ ] deck performance отображается;
- [ ] top players отображаются;
- [ ] popular matchups отображаются;
- [ ] tournament links ведут на `/tournaments/:id`;
- [ ] player links ведут на `/players/:id`;
- [ ] deck links ведут на `/decks/:id`;
- [ ] empty response корректно отображается;
- [ ] API error корректно отображается.

## Tournaments list

Endpoint:

```http
GET /api/v1/tournaments
```

Проверки:

- [ ] страница открывается по `/tournaments`;
- [ ] список турниров отображается;
- [ ] фильтры передаются в query params;
- [ ] клик по турниру ведет на detail page;
- [ ] empty state работает;
- [ ] error state работает.

## Tournament detail

Endpoint:

```http
GET /api/v1/tournaments/:id
```

Проверки:

- [ ] страница открывается по `/tournaments/:id`;
- [ ] header турнира отображается;
- [ ] финальные стендинги отображаются;
- [ ] раунды/паринги отображаются;
- [ ] список игрок -> колода отображается;
- [ ] игроки кликабельны;
- [ ] колоды кликабельны;
- [ ] 404/NOT_FOUND отображается корректно;
- [ ] error state работает.

## Players list

Endpoint:

```http
GET /api/v1/players
```

Проверки:

- [ ] страница открывается по `/players`;
- [ ] список игроков отображается;
- [ ] фильтры передаются в query params;
- [ ] клик по игроку ведет на `/players/:id`;
- [ ] empty state работает;
- [ ] error state работает.

## Player detail

Endpoint:

```http
GET /api/v1/players/:id
```

Проверки:

- [ ] страница открывается по `/players/:id`;
- [ ] summary игрока отображается;
- [ ] турниры игрока отображаются;
- [ ] колоды игрока отображаются;
- [ ] tournament links работают;
- [ ] deck links работают;
- [ ] 404/NOT_FOUND отображается корректно;
- [ ] error state работает.

## Decks list

Endpoint:

```http
GET /api/v1/decks
```

Проверки:

- [ ] страница открывается по `/decks`;
- [ ] список колод отображается;
- [ ] фильтры передаются в query params;
- [ ] клик по колоде ведет на `/decks/:id`;
- [ ] empty state работает;
- [ ] error state работает.

## Deck detail

Endpoint:

```http
GET /api/v1/decks/:id
```

Проверки:

- [ ] страница открывается по `/decks/:id`;
- [ ] summary колоды отображается;
- [ ] результаты колоды по турнирам отображаются;
- [ ] игроки на колоде отображаются;
- [ ] tournament links работают;
- [ ] player links работают;
- [ ] 404/NOT_FOUND отображается корректно;
- [ ] error state работает.

## Create tournament

Endpoint:

```http
POST /api/v1/admin/tournaments/import
```

Проверки:

- [ ] страница открывается по `/admin/tournaments/create`;
- [ ] дата турнира обязательна;
- [ ] cityId обязателен;
- [ ] после выбора cityId подгружаются клубы;
- [ ] clubId обязателен;
- [ ] tournamentType обязателен;
- [ ] formatId обязателен;
- [ ] finalStandingsFile обязателен;
- [ ] allRoundsFile обязателен;
- [ ] playerDecksText обязателен;
- [ ] форма отправляет `multipart/form-data`;
- [ ] success response показывает успешный результат;
- [ ] после success можно перейти на созданный турнир;
- [ ] validation errors отображаются пользователю;
- [ ] warnings отображаются пользователю;
- [ ] network error отображается пользователю.

## Production check

- [ ] `npm run lint` проходит.
- [ ] `npm run test` проходит, если тесты настроены.
- [ ] `npm run build` проходит.
- [ ] `npm run preview` открывает production build локально.
- [ ] production env использует `VITE_USE_MOCKS=false`.
- [ ] production env использует правильный `VITE_API_BASE_URL`.
