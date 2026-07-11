# Architecture

**Companion docs:** [REQUIREMENTS.md](./REQUIREMENTS.md) · [UIUX.md](./UIUX.md) · [README.md](../README.md)

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
└── app/[locale]/      # Routes
```

## Routes

| Route | Auth | Cache | Notes |
|-------|------|-------|--------|
| `/[locale]` | Public | CDN-friendly | Landing; redirects if session |
| `/[locale]/login`, `/signup` | Public | CDN-friendly | Account sign-in / sign-up |
| `/[locale]/privacy`, `/terms`, `/join/[token]` | Public | CDN-friendly | Legal · group invite activation |
| `/[locale]/admin` | Public | — | Legacy redirect → `/login` |
| `/[locale]/groups`, `/groups/new` | Session | private | Group hub · create group |
| `/[locale]/change-password` | Session | private | Forced / optional password change |
| `/[locale]/tasks`, `/tasks/new`, `/tasks/[id]` | Session + group | private | Boards, list, CRUD |
| `/[locale]/teammates`, `/teammates/new`, `/teammates/[id]` | Session + group | private | Operator team management |
| `/[locale]/alerts`, `/profile`, `/settings` | Session + group | private | Alerts · account · prefs |

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

**User model:** sign up as a normal user → create or join a **group** → role (`operator` / `teammate`) comes from group membership.

## Landing demo

CSS board animation in hero; optional `public/brand/demo.mp4` ([UIUX §2.0](./UIUX.md#20-marketing-landing)). Demo seed: `src/services/mock/data.ts` · login `sam@example.com` (operator in “Demo Shop”).

## Task forms

`src/components/tasks/task-form/` — `TaskFormFields`, `TaskFormActions`, `CreateTaskForm`, `EditTaskForm`. Create: title → assignee → due → description. Edit adds status + delete.

## Mock → API

1. Implement services under `src/services/api/`.
2. Set `NEXT_PUBLIC_SERVICE_MODE=api` in `getServices()`.
3. Components unchanged — landing and routes stay the same.

## Session sync (mock only)

Edits live in `SyncProvider` until sync succeeds; sync bar on failure. Refresh discards unsent changes.

## Run

```bash
npm install && npm run dev && npm run check:routes
```

`http://localhost:3000` — landing · `/en/login` — sign in · **demo:** `sam@example.com` / `ana@example.com` (any password) · new signup → `/groups`.
