# Codex Guidelines: MTG Global Stats MVP Frontend

## 1. Purpose of this document

This document describes how the AI coding agent should work on the MVP frontend for the MTG Global Stats web application.

The goal is to build a public React web application for Magic: The Gathering tournament statistics. The first MVP must be simple, stable, readable, and easy to extend. Do not over-engineer the application, but do not make architectural decisions that will block future features.

The frontend must be developed around the API contracts already prepared for the project:

- create tournament API;
- home page API;
- tournament detail API;
- player detail API;
- deck detail API.

If the backend is not ready yet, use typed mock data and keep the API layer structured so that real requests can be plugged in later without rewriting pages.

---

## 2. Product goal

The MVP website should allow any user to open the site without authorization and see MTG tournament statistics.

The first public default slice is:

- city: Moscow;
- format: Legacy;
- club: all clubs;
- tournament type: all types;
- period: all available data or backend default.

In future versions users should be able to filter statistics by the same entities that are used when creating a tournament:

- city;
- club;
- format;
- tournament type;
- date range.

The frontend must be designed with this future filtering in mind, even if the first MVP uses default values.

---

## 3. Recommended stack

Use this stack unless explicitly instructed otherwise:

- React;
- TypeScript;
- Vite;
- React Router;
- TanStack Query for server state;
- Axios or Fetch wrapper for HTTP requests;
- CSS Modules, Tailwind CSS, or a small design system layer. Prefer one consistent styling approach;
- Recharts or a similar lightweight chart library for charts;
- ESLint + Prettier;
- Vitest + React Testing Library for basic tests.

Avoid adding heavy dependencies unless there is a clear reason.

---

## 4. General development principles

### 4.1. Type everything

All API responses, request params, page models, and component props must be typed.

Do not use `any` unless there is no reasonable alternative. If temporary typing is needed, use `unknown` and narrow it.

### 4.2. Keep API models separate from UI models when needed

If backend contracts are convenient for UI, use them directly. If the UI needs a transformed shape, create mapper functions.

Recommended structure:

```text
src/api/models/
src/entities/
src/features/
src/pages/
src/shared/
```

### 4.3. Do not calculate complex statistics on the frontend

The backend should return already prepared values for the main statistic blocks:

- winrate;
- record;
- metagame share;
- matches count;
- tournament count;
- best rank.

The frontend may only do simple formatting:

- percentages;
- dates;
- labels;
- empty states;
- sorting only when explicitly safe.

### 4.4. Stable IDs are required

Whenever the UI displays a tournament, player, deck, city, club, or format, it must use the entity `id` from the API.

Do not build links from names.

Correct:

```ts
/player/player_123
/decks/deck_lands
/tournaments/tournament_456
```

Incorrect:

```ts
/players/Комаров-Никита
/decks/Lands
```

---

## 5. Expected routes

The MVP frontend should support these routes:

```text
/
/tournaments
/tournaments/:id
/players
/players/:id
/decks
/decks/:id
/admin/tournaments/create
```

For the first iteration, if detail pages are not implemented yet, routes can show a placeholder page, but the app structure and links should already be prepared.

---

## 6. Main pages

### 6.1. Home page

Route:

```text
/
```

Purpose:

Show the public dashboard for the default statistics slice.

Initial request:

```http
GET /api/v1/home?cityId=moscow&formatId=legacy
```

Blocks to render:

1. Summary cards;
2. Recent tournaments;
3. Deck metagame;
4. Deck performance;
5. Top players;
6. Popular matchups.

Required UI behavior:

- show loading state while data is loading;
- show empty state if there is no data;
- show error state if request failed;
- tournament, player, and deck names must be clickable when ids are available;
- charts must not replace tables entirely: tables are required for precise reading.

Recommended visual structure:

```text
Page header
Filter summary
Summary cards
Recent tournaments table
Deck metagame chart + table
Deck performance table
Top players table
Popular matchups table
```

### 6.2. Tournaments list

Route:

```text
/tournaments
```

Purpose:

Show all tournaments matching filters.

Expected API:

```http
GET /api/v1/tournaments
```

Filters should eventually match:

- cityId;
- clubId;
- formatId;
- tournamentType;
- dateFrom;
- dateTo.

### 6.3. Tournament detail page

Route:

```text
/tournaments/:id
```

Purpose:

Show source-level tournament data:

- header;
- final standings;
- all rounds / pairings;
- player-to-deck list;
- tournament metagame, if available.

Expected API:

```http
GET /api/v1/tournaments/:id
```

Minimum UI tabs:

```text
Standings
Rounds
Decks
```

Optional later tab:

```text
Metagame
```

### 6.4. Players list

Route:

```text
/players
```

Purpose:

Show players matching filters and allow the user to open a player profile.

Expected API:

```http
GET /api/v1/players
```

### 6.5. Player detail page

Route:

```text
/players/:id
```

Purpose:

Show player statistics:

- summary;
- tournaments where the player participated;
- decks used by the player;
- match history in a future version.

Expected API:

```http
GET /api/v1/players/:id
```

### 6.6. Decks list

Route:

```text
/decks
```

Purpose:

Show decks matching filters and allow the user to open a deck page.

Expected API:

```http
GET /api/v1/decks
```

### 6.7. Deck detail page

Route:

```text
/decks/:id
```

Purpose:

Show deck statistics:

- summary;
- tournament results;
- players who played this deck;
- matchups in a future version.

Expected API:

```http
GET /api/v1/decks/:id
```

### 6.8. Create tournament admin page

Route:

```text
/admin/tournaments/create
```

Purpose:

Allow manual MVP tournament upload.

Required fields:

- date;
- city;
- club;
- tournament type;
- format;
- final standings CSV;
- all rounds CSV;
- player-deck text list.

Expected APIs:

```http
GET /api/v1/cities
GET /api/v1/cities/:cityId/clubs
GET /api/v1/formats
POST /api/v1/admin/tournaments/import
```

Important behavior:

- city is required;
- clubs are loaded after city selection;
- club belongs to selected city;
- same club names in different cities are allowed;
- frontend sends `clubId`, not free text club name;
- frontend sends `cityId`, not free text city name.

---

## 7. UI component guidelines

Create reusable components instead of duplicating markup.

Recommended shared components:

```text
AppLayout
PageHeader
Card
SummaryCard
DataTable
Tabs
Badge
EntityLink
FilterBar
SearchableSelect
DateRangePicker
FileInput
TextArea
EmptyState
ErrorState
LoadingState
PercentValue
RecordValue
```

### 7.1. Tables

Use tables for statistics and source data. Tables should support:

- horizontal scroll on mobile;
- compact layout;
- clear column headers;
- clickable entity names;
- empty state;
- loading state.

### 7.2. Charts

Charts are useful, but must be secondary to tables.

For metagame, prefer horizontal bar chart over pie chart because there can be many decks.

Use charts only for:

- deck metagame top decks;
- maybe winrate comparison later.

### 7.3. Entity links

Create one component for entity links:

```tsx
<EntityLink type="player" id={player.id} name={player.name} />
<EntityLink type="deck" id={deck.id} name={deck.name} />
<EntityLink type="tournament" id={tournament.id} name={tournament.title} />
```

Do not duplicate route-building logic across pages.

---

## 8. Filtering behavior

Filters must be designed around tournament creation entities:

- city;
- club;
- format;
- tournament type;
- date range.

MVP default:

```text
cityId = moscow
formatId = legacy
clubId = undefined
```

Future behavior:

- user selects city;
- frontend reloads club options for this city;
- user selects club or leaves “all clubs”;
- user selects format;
- user selects tournament type;
- user selects date range;
- frontend reloads current page data with query params.

Use URL query params for filters where practical, for example:

```text
/?cityId=moscow&formatId=legacy&clubId=club_1&dateFrom=2026-07-01&dateTo=2026-07-31
```

This makes filtered pages shareable.

---

## 9. API layer guidelines

Create a single API client configuration.

Recommended structure:

```text
src/api/client.ts
src/api/home.ts
src/api/tournaments.ts
src/api/players.ts
src/api/decks.ts
src/api/dictionaries.ts
src/api/adminTournaments.ts
```

Use environment variable:

```text
VITE_API_BASE_URL
```

Do not hardcode backend URL inside components.

Example:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

All requests must go through the API layer, not directly from pages.

---

## 10. Mock data mode

Backend may not be ready when frontend development starts.

The agent should support one of these approaches:

1. Local mock JSON files;
2. Mock service functions in the API layer;
3. MSW if needed.

Keep mocks typed and close to the real API contracts.

Do not build UI with random untyped objects.

---

## 11. States and error handling

Every data page must handle:

- loading;
- error;
- empty data;
- success.

Error text should be understandable for a user, not just raw technical error.

Example:

```text
Не удалось загрузить статистику. Попробуйте обновить страницу.
```

Admin import page should show backend validation errors as a list. Each error should include:

- message;
- source if available;
- player name / row / round / table if available.

---

## 12. Formatting rules

### 12.1. Dates

Display dates in Russian-friendly format:

```text
08.07.2026
```

API dates are expected as ISO date strings:

```text
2026-07-08
```

### 12.2. Percentages

If API returns `61.1`, display:

```text
61.1%
```

Do not multiply by 100 unless contract explicitly says value is a fraction.

### 12.3. Records

Display records as:

```text
4-0
3-1
2-1-1
```

If API returns wins/losses/draws separately, format with a helper function.

---

## 13. Styling direction

The website should look like a clean analytical dashboard, not like a fantasy game interface.

Visual direction:

- light theme first;
- clean cards;
- readable tables;
- restrained accent color;
- high contrast text;
- responsive layout;
- no overloaded decorative elements.

The product is about data clarity.

---

## 14. Responsive requirements

The site must be usable on:

- desktop;
- tablet;
- mobile.

Tables may use horizontal scroll on small screens.

Summary cards should wrap into multiple rows on small screens.

Navigation should remain accessible on mobile.

---

## 15. Testing expectations

Minimum tests:

- API mappers / formatters;
- record formatting;
- percentage formatting;
- major page smoke tests;
- entity link route generation.

Do not aim for full coverage in MVP. Focus on logic that can easily break.

---

## 16. Build and quality checks

Before considering work done, run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If some command is not configured yet, add it or clearly document why it is missing.

---

## 17. Deployment expectations

The project should be deployable as a static frontend.

Expected build output:

```text
dist/
```

The deployment target can be decided later, but the frontend should work with:

- Vercel;
- Netlify;
- Timeweb static hosting;
- any nginx/static hosting.

The app must read backend URL from environment variable.

For SPA routing, hosting must fallback to `index.html` for unknown paths.

---

## 18. Development order for the agent

Follow this order:

1. Initialize React + TypeScript + Vite project.
2. Configure routing.
3. Configure linting, formatting, typecheck, test commands.
4. Create base layout and shared UI components.
5. Create typed API models.
6. Add mock API layer.
7. Build Home page.
8. Build Tournaments list and Tournament detail pages.
9. Build Players list and Player detail pages.
10. Build Decks list and Deck detail pages.
11. Build Create Tournament admin page.
12. Replace mocks with real API calls when backend is ready.
13. Add responsive polish.
14. Add smoke tests and formatter tests.
15. Prepare production build and deployment notes.

Do not start from styling only. First build a clean, typed data flow and route structure.

---

## 19. Definition of Done

The MVP frontend is done when:

- project runs locally;
- home page loads data from mock or real API;
- all planned routes exist;
- tournament, player, and deck ids are used for navigation;
- filters are structurally prepared;
- create tournament form exists and can submit multipart data;
- loading, empty, and error states are implemented;
- app is responsive enough for desktop and mobile;
- build command succeeds;
- deployment instructions are documented.

---

## 20. What not to do in MVP

Do not implement:

- user authorization;
- user profiles;
- premium features;
- decklists with 75 cards;
- Elo rating;
- complex player ranking formula;
- advanced matchup explorer;
- city/club creation from public UI;
- editing imported tournaments;
- dark theme unless specifically requested.

These can be added later after the basic product is working.

---

## 21. Communication rule for the agent

When making implementation decisions, prefer simple and explicit solutions.

If a backend field is missing, do not invent data silently. Add a TODO, use a safe placeholder, or ask for the contract to be updated.

If API and UI requirements conflict, keep the UI typed and document the mismatch.

The final result should be a maintainable MVP, not a one-off prototype.
