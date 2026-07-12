# Architecture

**Companion docs:** [REQUIREMENTS.md](./REQUIREMENTS.md) · [UIUX.md](./UIUX.md) · [ENVIRONMENTS.md](./ENVIRONMENTS.md) · [README.md](../README.md)

Presentation, domain types, and data access are separated so mock → API is a single swap. One Next.js deploy serves the **landing** and the **signed-in app**.

```
src/
├── domain/types.ts       # UserGroup, Session, Task, …
├── services/
│   ├── contracts.ts      # AuthService, GroupService, …
│   ├── index.ts          # getServices() — mock | api
│   ├── mock/             # ✅ activo
│   └── api/              # ❌ Phase 1 — implementar para dev-hybrid
├── lib/
│   ├── entry-route.ts    # Post-auth redirects
│   └── session-hydrate.ts # Role + auto-pick (login only; readSession não auto-pick)
├── app/actions/groups.ts # Group panel — thin → getServices()
└── app/[locale]/
    ├── groups/auto/      # Route handler: persist sole-group auto-select
    └── (app)/groups/     # Placeholder + panel auto-open
```

## Groups (UI + boundary)

| Peça | Ficheiro | Notas |
|------|----------|-------|
| Switcher + panel open | `group-switcher.tsx` | Desktop dropdown · mobile popover ancorado ao trigger |
| Lista + forms | `group-panel-menu.tsx` | Create/join com `useFormState` — erros inline, sem reload |
| Server actions | `app/actions/groups.ts` | `selectGroup`, `createGroupForm`, `redeemInviteForm`, `acceptInvite` |
| Tipos | `UserGroup` | `Group & { role }` — paridade `GET /groups` |
| Mock | `services/mock/groups.mock.ts` | `listForUser` devolve roles |
| Auto-select 1 grupo | `groups/auto/route.ts` | Cookie write (Route Handler, não RSC) |

Fluxo invite inválido: erro no formulário, header intacto (sem redirect/cookies flash).

## Routes

| Route | Auth | Cache | Notes |
|-------|------|-------|--------|
| `/[locale]` | Public | CDN-friendly | Landing; redirects if session |
| `/[locale]/login`, `/signup` | Public | CDN-friendly | Account sign-in / sign-up |
| `/[locale]/privacy`, `/terms`, `/join/[token]` | Public | CDN-friendly | Legal · group invite activation |
| `/[locale]/admin` | Public | — | Legacy redirect → `/login` |
| `/[locale]/groups` | Session | private | No active group — panel opens · `/groups/new` → `?create=1` |
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

Demo seed: `src/services/mock/data.ts` · `sam@example.com` (2 groups → `/groups` + panel) · `ana@example.com` (teammate → tasks) · invite demo: `mock-invite-ana-side` as ana joins Side Project.

## Task forms

`src/components/tasks/task-form/` — `TaskFormFields`, `TaskFormActions`, `CreateTaskForm`, `EditTaskForm`. Create: title → assignee → due → description. Edit adds status + delete.

## Mock → API

| Camada | Mock (hoje) | API (dev-hybrid) |
|--------|-------------|------------------|
| Entrada | `getServices()` → `mock/*` | `getServices()` → `api/*` |
| Sessão | Cookie `sirrelay_mock_session` | jose + httpOnly cookie |
| Grupos | `MockGroupService` | Prisma `group_memberships` |
| Actions | `app/actions/groups.ts` | **Inalteradas** — chamam `getServices()` |

Passos:

1. Implementar `src/services/api/*` (contratos em `contracts.ts`).
2. `prisma/schema.prisma` + migrate + seed.
3. Ramo `api` em `getServices()` + `GET /api/v1/health`.
4. `NEXT_PUBLIC_SERVICE_MODE=api` em `.env.local` · `npm run dev-hybrid`.

Checklist completa: [ENVIRONMENTS.md §2](./ENVIRONMENTS.md#dev-híbrido--checklist-de-prontidão).

## Session sync (mock only)

Edits live in `SyncProvider` until sync succeeds; sync bar on failure. Refresh discards unsent changes.

## Run

```bash
npm install && npm run dev-mock && npm run check:routes
# dev-hybrid (quando API existir): npm run dev-hybrid
```

`http://localhost:3000` — landing · `/en/login` — sign in · **demo:** `sam@example.com` (2 groups → `/groups`) · `ana@example.com` (teammate → tasks) · invite: `mock-invite-ana-side` as ana@example.com
