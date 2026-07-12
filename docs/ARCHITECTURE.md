# Architecture

**Companion docs:** [REQUIREMENTS.md](./REQUIREMENTS.md) · [UIUX.md](./UIUX.md) · [ENVIRONMENTS.md](./ENVIRONMENTS.md) · [README.md](../README.md)

Presentation, domain types, and data access are separated so mock → API is a single swap. One Next.js deploy serves the **landing** and the **signed-in app**.

```
src/
├── domain/types.ts
├── services/          # contracts · index.ts (getServices) · mock/
├── components/
│   ├── landing/       # Public marketing page
│   ├── layout/        # App shell · SiteFooter
│   ├── tasks/         # Boards, lists, forms
│   ├── alerts/ · profile/ · sync/
│   └── ui/<name>/
├── lib/entry-route.ts # Post-auth redirects
├── app/actions/groups.ts  # Group panel server actions (thin → getServices)
└── app/[locale]/      # Routes
```

## Routes

| Route | Auth | Cache | Notes |
|-------|------|-------|--------|
| `/[locale]` | Public | CDN-friendly | Landing; redirects if session |
| `/[locale]/login`, `/signup` | Public | CDN-friendly | Account sign-in / sign-up |
| `/[locale]/privacy`, `/terms`, `/join/[token]` | Public | CDN-friendly | Legal · group invite activation |
| `/[locale]/admin` | Public | — | Legacy redirect → `/login` |
| `/[locale]/groups` | Session | private | No active group — panel opens · `/groups/new` → redirect |
| `/[locale]/change-password` | Session | private | Forced / optional password change |
| `/[locale]/tasks`, `/tasks/new`, `/tasks/[id]` | Session + group | private | Boards, list, CRUD |
| `/[locale]/teammates`, `/teammates/new`, `/teammates/[id]` | Session + group | private | Operator team management |
| `/[locale]/alerts`, `/settings` | Session + group | private | Alerts · group alert prefs |
| `/[locale]/profile` | Session | private | Account (accessible without active group) |

**Backend (Phase 1+):** `/api/v1/*` · Prisma · Telegram webhook · **Phase 2:** `/audit`

## Entry redirects

`src/lib/entry-route.ts` — verify with `npm run check:routes`:

| Session | Destination |
|---------|-------------|
| Logged out | `/[locale]` |
| `mustChangePassword` | `/[locale]/change-password` |
| No `activeGroupId` | `/[locale]/groups` |
| Operator in group | `/[locale]/teammates` |
| Teammate in group | `/[locale]/tasks` |

Unauthenticated access to app routes → `/login?session=expired`.

**User model:** one **account** per person → zero or more **groups** → **role per membership** (`operator` / `teammate`). Session: `{ user, activeGroupId }`; effective role from `hydrateSession()` + `group_memberships`. `UserGroup` in `domain/types.ts` matches `GET /groups` (id, name, role).

## Landing demo

Demo seed: `src/services/mock/data.ts` · `sam@example.com` (2 groups → `/groups` + panel) · `ana@example.com` (teammate → tasks) · invite demo: `mock-invite-ana-side` as ana joins Side Project.

## Task forms

`src/components/tasks/task-form/` — `TaskFormFields`, `TaskFormActions`, `CreateTaskForm`, `EditTaskForm`. Create: title → assignee → due → description. Edit adds status + delete.

## Mock → API

1. Implement services under `src/services/api/`.
2. Set `NEXT_PUBLIC_SERVICE_MODE=api` in `getServices()`.
3. Components unchanged — landing and routes stay the same.

See [ENVIRONMENTS.md](./ENVIRONMENTS.md) for the **four environments** (dev mock · dev hybrid · prod local · prod VPS).

## Session sync (mock only)

Edits live in `SyncProvider` until sync succeeds; sync bar on failure. Refresh discards unsent changes.

## Run

```bash
npm install && npm run dev && npm run check:routes
# ou por ambiente: npm run dev-mock | dev-hybrid | prod-local
```

`http://localhost:3000` — landing · `/en/login` — sign in · **demo:** `sam@example.com` (2 groups → `/groups`) · `ana@example.com` (teammate → tasks) · invite: `mock-invite-ana-side` as ana@example.com
