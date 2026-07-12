# Env configuration

Текущий `.env.example` отражает не только mock/backend переключение, но и временную фронтовую авторизацию для служебного раздела.

## Актуальный `.env.example`

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

# Mock scenario for frontend-only development.
# default - filled demo data
# empty   - empty states without entities
VITE_MOCK_SCENARIO=default

# Temporary frontend auth for admin screens.
# Replace these values before sharing the build.
VITE_ADMIN_LOGIN=admin
VITE_ADMIN_PASSWORD=123456
VITE_ADMIN_DISPLAY_NAME=Администратор
```

## Локальная разработка без backend

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=true
VITE_MOCK_SCENARIO=default
VITE_ADMIN_LOGIN=admin
VITE_ADMIN_PASSWORD=123456
VITE_ADMIN_DISPLAY_NAME=Администратор
```

## Локальная разработка с backend

Если backend уже готов для публичных ручек, но auth ещё нет, фронт всё ещё может использовать временный local-only вход для `/admin/tournaments/create`.

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCKS=false
VITE_ADMIN_LOGIN=admin
VITE_ADMIN_PASSWORD=123456
VITE_ADMIN_DISPLAY_NAME=Администратор
```

## Production

Для production с реальным backend:

```env
VITE_API_BASE_URL=https://<production-api-domain>/api/v1
VITE_USE_MOCKS=false
```

Если production всё ещё временно работает с фронтовой mock-авторизацией, эти переменные тоже должны быть заданы явно:

```env
VITE_ADMIN_LOGIN=<temporary-admin-login>
VITE_ADMIN_PASSWORD=<temporary-admin-password>
VITE_ADMIN_DISPLAY_NAME=<temporary-admin-name>
```

## Что важно помнить

- `.env.local` не коммитим;
- `.env.example` держим в актуальном состоянии;
- `VITE_API_BASE_URL` не хардкодим в компонентах;
- `VITE_USE_MOCKS` должен полностью переключать источник данных;
- `VITE_MOCK_SCENARIO=empty` нужен для проверки empty states;
- auth-переменные временные и должны исчезнуть, когда фронт перейдёт на реальный `POST /auth/login`.
