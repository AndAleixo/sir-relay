# Architecture — UI mock phase

This repo separates **presentation**, **domain types**, and **data access** so mock → API is a single swap.

```
src/
├── domain/types.ts          # Shared types (no React, no fetch)
├── services/
│   ├── contracts.ts         # Service interfaces (incl. createTeammate)
│   ├── index.ts             # getServices() — swap point
│   └── mock/                # Mock implementations + seed data
├── components/
│   ├── ui/<name>/           # Primitives: *.tsx + *.styles.ts
│   ├── layout/              # App shell, header, locale switcher, user menu
│   ├── alerts/              # Operator alert feed list
│   ├── profile/             # Avatar, profile editor, change password
│   ├── sync/                # Session sync bar + SyncProvider
│   └── tasks/               # Feature UI (boards, cards, lists)
├── hooks/                   # e.g. use-profile-avatar (localStorage mock)
├── lib/sync/                # Retry config + mutation executor
└── app/                     # Routes — fetch via getServices(), pass props down
```

## Mock routes (implemented)

| Route | Notes |
|-------|--------|
| `/[locale]/tasks` | Boards, list toggle, drag-and-drop, session sync |
| `/[locale]/tasks/new` | Create task — assign to **Me** or teammate |
| `/[locale]/teammates` | Team list (operators + teammates) |
| `/[locale]/teammates/new` | Create teammate → redirects to detail |
| `/[locale]/teammates/[id]` | Invite + Telegram links (static mock URLs) |
| `/[locale]/alerts` | Operator alert feed (task done, due/overdue) |
| `/[locale]/profile` | Photo (localStorage), password form, logout |
| `/[locale]/settings` | Language + operator alert preferences |
| `/[locale]/admin` | Sign-in portal (Model A) |

**Planned Phase 1 (not in UI mock yet):** `/join/[token]`, `/change-password`, `/tasks/[id]/edit`, `/audit`, `/api/v1/*`, Prisma, Telegram webhook.

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

Open `http://localhost:3000` — redirects to `/admin` when logged out.

**Mock login:** `alex@example.com` (Operator) · `ana@example.com` (Teammate) · any non-empty password. Switch roles via logout and sign in again.
