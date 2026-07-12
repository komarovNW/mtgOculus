# Env configuration

Текущий `.env.example` отражает рабочий режим с реальным backend API.

## Актуальный `.env.example`

```env
# Base URL backend API.
# Local backend example:
# VITE_API_BASE_URL=http://localhost:8000/api/v1
# Production example:
# VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Локальная разработка

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Production

Для production с реальным backend:

```env
VITE_API_BASE_URL=https://<production-api-domain>/api/v1
```

## Что важно помнить

- `.env.local` не коммитим;
- `.env.example` держим в актуальном состоянии;
- `VITE_API_BASE_URL` не хардкодим в компонентах;
- вход в служебный раздел сейчас использует Basic auth c парой `admin/admin`;
- mock-файлы сохранены в репозитории, но в активный runtime не подключены.
