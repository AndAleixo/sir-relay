# Architecture

**Companion docs:** [REQUIREMENTS.md](./REQUIREMENTS.md) · [UIUX.md](./UIUX.md) · [ENVIRONMENTS.md](./ENVIRONMENTS.md) · [README.md](../README.md)

Presentation, domain types, and data access are separated so mock → API is a single swap. One Next.js deploy serves the **landing** and the **signed-in app**.

```
src/
├── domain/types.ts       # UserGroup, Session, Task, …
├── services/
│   ├── contracts.ts      # AuthService, GroupService, InvitationService, …
│   ├── index.ts          # getServices() — mock | api
│   ├── mock/             # dev-mock
│   └── api/              # dev-hybrid (Prisma)
├── lib/
│   ├── entry-route.ts    # Post-auth redirects
│   ├── session-hydrate.ts # Role + resume group on login
│   └── task-queue.ts     # To do order helpers (buildTodoQueueOrder, placeIdAtIndex, …)
├── app/actions/
│   ├── auth.ts           # Login, signup, logout, password
│   ├── groups.ts         # Group panel
│   ├── invitations.ts    # Accept / decline pending group invites
│   ├── teammates.ts      # Teammate CRUD + promote
│   ├── tasks.ts          # Tasks + alert prefs + placeInTodoQueue
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
| Lista + forms | `group-panel-menu.tsx` | Switch/create/join + accept/decline pending requests · leave/delete in `group-danger-settings.tsx` |
| Server actions | `app/actions/groups.ts` + `invitations.ts` | Group lifecycle + consent-based invitation responses |
| Teammate actions | `app/actions/teammates.ts` | pre-create/update/remove (assigned group tasks + membership)/promote/regenerate-invite |
| Tipos | `UserGroup` | `Group & { role }` — paridade `GET /groups` |
| Mock | `services/mock/groups.mock.ts` | `listForUser` devolve roles · leave/delete |
| Invitation consent | `services/{api,mock}/invitations*` | Existing active account: pending → accept/decline; membership only on accept |
| Auto-select / resume | `api/membership.ts` · `users.last_active_group_id` | 1 grupo → auto · 2+ → último grupo no login |
| Auto-select 1 grupo | `groups/auto/route.ts` | Cookie write (Route Handler, não RSC) |

Fluxo invite inválido: erro no formulário, header intacto (sem redirect/cookies flash).

**Pre-create + activation:** new email → `users` row `account_status: invited` + membership + activation link. Existing active email → `group_invitations` request only; acceptance creates membership. **Sign-up email merge (P1-AUTH-13) is not shipped** — signup rejects existing emails including `invited`.

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

**Backend (Phase 1):** Prisma + server actions · `/api/v1/health` · Telegram webhook · (optional full REST) · **Phase 2:** `/audit`

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

**User model:** one **account** per person → zero or more **groups** → **role per membership** (`operator` / `teammate`) + optional per-membership **`display_name`** (fantasy label; own edit on **Settings**, operator edit on member detail). Session: `{ user, activeGroupId }`; effective role from `hydrateSession()` + `group_memberships`. Account `users.name` is owner-only (Profile); operators must not mutate it. **Telegram** is account-scoped on Profile (`telegram_chat_id` on `users`) — **task relay** for any linked assignee; operators **also** get alert DMs. Group UI label: `display_name ?? users.name` (invited pending → show email). `UserGroup` in `domain/types.ts` matches `GET /groups` (id, name, role).

**Add teammate:** email-only pre-create / consent invitation; person sets account name on `/join/<token>` (not via signup merge until P1-AUTH-13).

## Landing demo

Demo seed: `src/services/mock/data.ts` · `sam@example.com` / `demo12345` (dev-hybrid) · 2 groups → login resume **Demo Shop** · `ana@example.com` (active teammate → tasks) · activation: `mock-invite-carla` for invited Carla.

## Task queue & boards

- Order helpers: `src/lib/task-queue.ts` · check: `npm run check:queue`
- Persist queue: `placeInTodoQueue` (server action / sync layer)
- UI: `TodoReorderList` + `resolveTodoDropIndex` — drop inside `[data-todo-scroll]` = insert by Y; outside = append
- Operator board column order: self first, then members by To do count desc

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

**API layer:** `src/services/api/` — Prisma-backed implementations of `contracts.ts`. Health: `GET /api/v1/health` · Telegram link: `POST /api/v1/telegram/webhook`. Full REST `/api/v1/*` beyond those routes is optional — the UI uses server actions.

## Session sync

`SyncProvider` wraps the signed-in app (mock and API). Optimistic UI + mutation queue; sync bar on failure. Full offline conflict UX remains Phase 3 (P3-07). Refresh discards unsent changes.

## Run

```bash
npm install && npm run dev-mock && npm run check:routes
# dev-hybrid: npm run dev-hybrid   # Postgres + API · demo12345
```

`http://localhost:3000` — landing · `/en-gb/login` — sign in · **mock:** `sam@example.com` (any password) · **api:** `sam@example.com` / `demo12345` · activation: `mock-invite-carla` as carla@example.com
