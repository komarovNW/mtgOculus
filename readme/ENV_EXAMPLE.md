# .env.example

Создать в корне проекта файл `.env.example` со следующим содержимым:

```env
# Base URL backend API.
# Local backend example:
# VITE_API_BASE_URL=http://localhost:8000/api/v1
# Production example:
# VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Enables frontend mock data instead of real API requests.
# true  - use local mock data
# false - use real backend API
VITE_USE_MOCKS=true
```

## Локальная разработка без backend

Создать `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=true
```

## Локальная разработка с backend

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=false
```

## Production

```env
VITE_API_BASE_URL=https://<production-api-domain>/api/v1
VITE_USE_MOCKS=false
```

## Правила

- Не коммитить `.env.local`.
- `.env.example` должен быть закоммичен.
- В коде не должно быть захардкоженного API URL.
- Все запросы должны использовать `VITE_API_BASE_URL`.
- Mock mode должен включаться только через `VITE_USE_MOCKS`.
