# Architecture — UI mock phase

**Companion docs:** [REQUIREMENTS.md](./REQUIREMENTS.md) (spec) · [UIUX.md](./UIUX.md) (screens & components) · [README.md](../README.md) (start here)

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
│   ├── layout/              # App shell, sidebar, locale switcher, user menu
│   ├── alerts/              # Operator alert feed list
│   ├── profile/             # Avatar, profile editor
│   ├── sync/                # Session sync bar + SyncProvider
│   └── tasks/               # Boards, cards, lists, shared task forms
├── hooks/                   # e.g. use-profile-avatar (localStorage mock)
├── lib/sync/                # Retry config + mutation executor
└── app/                     # Routes — fetch via getServices(), pass props down
```

## Mock routes (implemented)

| Route | Notes |
|-------|--------|
| `/[locale]/admin` | Sign-in portal (Model A) |
| `/[locale]/join/[token]` | Teammate account activation |
| `/[locale]/change-password` | Forced first login + optional change |
| `/[locale]/privacy` | Privacy stub |
| `/[locale]/tasks` | Boards, list toggle, drag-and-drop, session sync |
| `/[locale]/tasks/new` | Create task — assign to **Me** or teammate |
| `/[locale]/tasks/[id]` | Edit task — re-notify, banners, delete |
| `/[locale]/teammates` | Team list + JSON export |
| `/[locale]/teammates/new` | Create teammate → redirects to detail |
| `/[locale]/teammates/[id]` | Edit, deactivate, invite/Telegram links, export |
| `/[locale]/alerts` | Operator alert feed |
| `/[locale]/profile` | Photo, password, Telegram link, logout |
| `/[locale]/settings` | Language + operator alert preferences |

**Phase 1 backend (not mock):** `/api/v1/*`, Prisma, Telegram webhook · **Phase 2:** `/audit`

## Entry redirects

Centralized in `src/lib/entry-route.ts`:

| Session | Destination |
|---------|-------------|
| Logged out | `/[locale]/admin` |
| `mustChangePassword` | `/[locale]/change-password` |
| Operator | `/[locale]/teammates` |
| Teammate | `/[locale]/tasks` |

Verify: `npm run check:routes`

## Task forms

Shared components under `src/components/tasks/task-form/`:

| Component | Used on |
|-----------|---------|
| `TaskFormFields` | Create + edit — same field order and spacing |
| `TaskFormActions` | Save / Cancel / Delete (edit only) |
| `CreateTaskForm` | `/tasks/new` |
| `EditTaskForm` | `/tasks/[id]` |

Create: title → assignee → due → description. Edit adds **status** and **delete**.

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

**Mock login:** `alex@example.com` (must change password on first login) · `sam@example.com` · `ana@example.com` · any non-empty password.
