# Architecture

**Companion docs:** [REQUIREMENTS.md](./REQUIREMENTS.md) · [UIUX.md](./UIUX.md) · [ENVIRONMENTS.md](./ENVIRONMENTS.md) · [README.md](../README.md)

Presentation, domain types, and data access are separated so mock → API is a single swap. One Next.js deploy serves the **landing** and the **signed-in app**.

```
src/
├── domain/types.ts       # UserGroup, Session, Task, …
├── services/
│   ├── contracts.ts      # AuthService, GroupService, …
│   ├── index.ts          # getServices() — mock | api
│   ├── mock/             # dev-mock
│   └── api/              # dev-hybrid (Prisma)
├── lib/
│   ├── entry-route.ts    # Post-auth redirects
│   └── session-hydrate.ts # Role + resume group on login
├── app/actions/
│   ├── auth.ts           # Login, signup, logout, password
│   ├── groups.ts         # Group panel
│   ├── teammates.ts      # Teammate CRUD + promote
│   ├── tasks.ts          # Tasks + alert prefs
│   ├── export.ts         # JSON export
│   └── settings.ts       # Locale preference
└── app/[locale]/
    ├── groups/auto/      # Route handler: persist sole-group auto-select
    └── (app)/groups/     # Placeholder + panel auto-open
```

## Groups (UI + boundary)

| Peça | Ficheiro | Notas |
|------|----------|-------|
| Switcher + panel open | `group-switcher.tsx` | Desktop dropdown · mobile popover (só um painel visível por breakpoint) |
| Lista + forms | `group-panel-menu.tsx` | Create/join only · leave/delete in `group-danger-settings.tsx` |
| Server actions | `app/actions/groups.ts` | `selectGroup`, `createGroupForm`, `redeemInviteForm`, `acceptInvite`, `leaveGroupForm`, `deleteGroupForm` |
| Teammate actions | `app/actions/teammates.ts` | pre-create/update/deactivate/promote/regenerate-invite |
| Tipos | `UserGroup` | `Group & { role }` — paridade `GET /groups` |
| Mock | `services/mock/groups.mock.ts` | `listForUser` devolve roles · leave/delete |
| Auto-select / resume | `api/membership.ts` · `users.last_active_group_id` | 1 grupo → auto · 2+ → último grupo no login |
| Auto-select 1 grupo | `groups/auto/route.ts` | Cookie write (Route Handler, não RSC) |

Fluxo invite inválido: erro no formulário, header intacto (sem redirect/cookies flash).

**Pre-create + activation:** `teammates.createTeammate` → `users` row `account_status: invited` + membership. Activation paths (spec §5.1.2): `auth.joinWithToken` (`/join/[token]`) **or** `auth.signup` merge when email matches `invited` (planned — P1-AUTH-13). Today signup rejects taken email even when `invited`; implementation pending.

## Routes

| Route | Auth | Cache | Notes |
|-------|------|-------|--------|
| `/[locale]` | Public | CDN-friendly | Landing; redirects if session |
| `/[locale]/login`, `/signup` | Public | CDN-friendly | Account sign-in / sign-up |
| `/[locale]/privacy`, `/terms`, `/join/[token]` | Public | CDN-friendly | Legal · group invite activation |
| `/[locale]/groups` | Session | private | No active group — panel opens automatically |
| `/[locale]/groups/auto` | Session | private | Auto-pick sole group (persist cookie) |
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

Demo seed: `src/services/mock/data.ts` · `sam@example.com` / `demo12345` (dev-hybrid) · 2 groups → login resume **Demo Shop** · `ana@example.com` (teammate → tasks) · invite: `mock-invite-ana-side` as ana joins Side Project.

## Task forms

`src/components/tasks/task-form/` — `TaskFormFields`, `TaskFormActions`, `CreateTaskForm`, `EditTaskForm`. Create: title → assignee → due → description. Edit adds status + delete.

## Mock → API

| Camada | Mock (hoje) | API (dev-hybrid) |
|--------|-------------|------------------|
| Entrada | `getServices()` → `mock/*` | `getServices()` → `api/*` |
| Sessão | Cookie `sirrelay_mock_session` | jose + httpOnly cookie |
| Grupos | `MockGroupService` | Prisma `group_memberships` |
| Actions | `app/actions/*` | Mode-agnostic — chamam `getServices()` |

Passos:

1. Implementar `src/services/api/*` (contratos em `contracts.ts`).
2. `prisma/schema.prisma` + migrate + seed.
3. Ramo `api` em `getServices()` + `GET /api/v1/health`.
4. `NEXT_PUBLIC_SERVICE_MODE=api` em `.env` · `npm run dev-hybrid`.

Checklist completa: [ENVIRONMENTS.md §2](./ENVIRONMENTS.md#2--dev-híbrido-oficina).

**API layer:** `src/services/api/` — Prisma-backed implementations of `contracts.ts`. Health: `GET /api/v1/health` · Telegram link: `POST /api/v1/telegram/webhook`.

## Session sync (mock only)

Edits live in `SyncProvider` until sync succeeds; sync bar on failure. Refresh discards unsent changes.

## Run

```bash
npm install && npm run dev-mock && npm run check:routes
# dev-hybrid: npm run dev-hybrid   # Postgres + API · demo12345
```

`http://localhost:3000` — landing · `/en-gb/login` — sign in · **mock:** `sam@example.com` (any password) · **api:** `sam@example.com` / `demo12345` · invite: `mock-invite-ana-side` as ana@example.com
