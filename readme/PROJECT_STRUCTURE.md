# Структура frontend

Magic Oculus использует упрощённое разделение по слоям. Оно помогает понимать,
где искать данные, страницу или переиспользуемый компонент.

## Дерево

```text
src/
  app/
    providers/       # React Query
    router/          # React Router
    styles/          # глобальные стили и темы
  entities/
    admin-tournament/
    deck/
    dictionaries/
    player/
    tournament/
  pages/
    digest/          # статический placeholder будущих статей
    ...              # остальные компоненты маршрутов
  shared/
    api/
      backend-mappers.ts
      client.ts
      endpoints.ts
      types.ts
    config/
      releases.ts     # версия и публичная история изменений
    lib/
    ui/
  test/
  widgets/
```

## Слои

### `app/`

Глобальная сборка приложения:

- провайдер TanStack Query;
- маршруты;
- общие стили, CSS variables, светлая и тёмная темы.

### `entities/`

API-функции по доменным сущностям. Здесь query params переводятся в backend
запросы, а raw-ответы проходят через mapper.

Порядок потока данных:

```text
page → entities/*/api.ts → shared/api/client.ts → backend
                                      ↓
                         shared/api/backend-mappers.ts
                                      ↓
                           frontend model из types.ts
```

### `pages/`

Компоненты, привязанные к маршрутам. Страница:

- читает URL и фильтры;
- запускает запросы;
- обрабатывает loading, empty и error;
- собирает интерфейс из shared UI и widgets.

`dailies/` переиспользует общий экран событий, но фиксирует тип `daily`.

`digest/` пока не загружает данные и не имеет слоя в `entities/`: это статическая
страница, зарезервированная под будущие ежемесячные статьи.

`changelog/` читает локальную историю версий и не обращается к backend.

### `shared/api/`

- `client.ts` — GET-запросы, публичный multipart POST и нормализация ошибок;
- `endpoints.ts` — все API paths;
- `backend-mappers.ts` — фактические типы raw backend-ответов и преобразования;
- `types.ts` — модели, которыми пользуется UI.

При изменении backend-контракта сначала обновляются raw-типы и mapper, а не
страницы.

### `shared/lib/`

Чистые утилиты:

- фильтры и URL;
- форматирование;
- пагинация;
- статистика игрока;
- проверка списка игроков и колод;
- построение ссылок сущностей.

### `shared/ui/`

Небизнесовые компоненты: кнопки, карточки, таблицы, select/input, состояния,
ссылки сущностей, tooltips, mana pips и `LoadMorePagination`.

### `widgets/`

Крупные составные блоки: layout, фильтры и секции главной страницы.

### `test/`

Unit, routing и component tests. Тесты находятся в одном каталоге и запускаются
через Vitest.

## Практические правила

- Новый маршрут добавляется в `src/app/router/router.tsx`.
- Новый API path добавляется в `src/shared/api/endpoints.ts`.
- Raw backend-ответ описывается в `backend-mappers.ts`.
- UI получает нормализованные типы из `types.ts`.
- Повторяющийся простой компонент идёт в `shared/ui`.
- Повторяющийся доменный блок страницы идёт в `widgets`.
- Изменение пользовательского поведения сопровождается обновлением
  соответствующего документа в `readme/`.
- Новый релиз добавляется первым в `src/shared/config/releases.ts`; его версия
  должна совпадать с `package.json`.
