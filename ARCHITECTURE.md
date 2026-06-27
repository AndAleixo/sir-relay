# Architecture — UI mock phase

This repo separates **presentation**, **domain types**, and **data access** so mock → API is a single swap.

```
src/
├── domain/types.ts          # Shared types (no React, no fetch)
├── services/
│   ├── contracts.ts         # Service interfaces
│   ├── index.ts             # getServices() — swap point
│   └── mock/                # Mock implementations + seed data
├── components/
│   ├── ui/<name>/           # Primitives: *.tsx + *.styles.ts
│   ├── layout/              # App shell, headers
│   ├── sync/                # Session sync bar + SyncProvider
│   └── tasks/               # Feature UI (boards, cards, lists)
├── lib/sync/                # Retry config + mutation executor
└── app/                     # Routes — fetch via getServices(), pass props down
```

## Swap mock → real API

1. Implement `ApiTaskService`, `ApiAuthService`, etc. under `src/services/api/`.
2. Update `getServices()` in `src/services/index.ts` when `NEXT_PUBLIC_SERVICE_MODE=api`.
3. **Do not change components** — only service implementations.

## Session sync (UI mock)

- **Server on load:** tasks come from the server on first visit or after refresh.
- **Session memory:** edits and pending mutations live in `SyncProvider` until sync succeeds.
- **Sync bar:** shown when retries fail; configurable via `NEXT_PUBLIC_SYNC_RETRY_*` in `.env`.
- **Refresh:** unsent changes are discarded; browser may warn via `beforeunload`.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — defaults to Operator mock session via login or direct `/en/tasks` after login.

Use **Settings → Preview role** to switch Operator / Teammate without reimplementing auth.
