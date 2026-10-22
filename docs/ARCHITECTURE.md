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
│   └── api/              # prod-local / VPS (Prisma)
├── lib/
│   ├── entry-route.ts    # Post-auth redirects
│   ├── session-hydrate.ts # Role + resume group on login
│   ├── task-queue.ts     # To do queue order helpers
│   ├── password-policy.ts # P2-SEC-04 — validate on set (grandfather login)
│   ├── login-lockout.ts  # P2-SEC-03 — 5 fails → 15 min
│   ├── csrf-origin.ts    # P2-SEC-06 — Origin/Referer same-origin check
│   ├── rate-limit.ts     # P2-SEC-07 — sliding window per IP
│   ├── safe-log.ts       # P2-SEC-11 — JSON logs + redaction
│   ├── authz.ts          # P2-SEC-01 — requireOperator / requireSelfUserId
│   ├── security-headers.ts # P2-SEC-05 — HSTS / CSP / frame deny / …
│   ├── client-board.ts   # Client board payload + create input
│   ├── client-upgrade.ts # 410 upgrade_required (+ optional minClient)
│   ├── link-token.ts     # Bearer session from link token
│   ├── connect-next.ts   # Safe return path for /connect
│   └── mail/             # P3-17 — sendMail · tokens · templates
├── app/actions/
│   ├── auth.ts           # Login, signup, logout, password, verify (POST confirm), reset, delete account
│   ├── contact.ts        # Public contact form → CONTACT_EMAIL
│   ├── groups.ts         # Group panel
│   ├── invitations.ts    # Accept / decline pending group invites
│   ├── teammates.ts      # Teammate CRUD + promote
│   ├── tasks.ts          # Tasks + alert prefs + placeInTodoQueue
│   ├── export.ts         # CSV export (server action)
│   ├── settings.ts       # Locale + group rename
│   ├── projects.ts       # Group projects + categories
│   └── connect.ts        # Issue link token / URI (editor + MCP clients)
├── app/api/v1/client/    # Bearer board + task mutate (editor extension + MCP)
├── app/api/v1/vscode/    # Retired — 410 upgrade_required (old clients)
└── app/[locale]/
    ├── groups/auto/      # Route handler: persist sole-group auto-select
    ├── connect/          # Link token for editor / MCP
    ├── vscode/connect/   # Legacy redirect → /connect
    └── (app)/groups/     # Placeholder + panel auto-open
```

**Editor extension:** `extensions/vscode/` (v1.x) — sidebar webview (SRelay); talks HTTP to `/api/v1/client/*` only (no Next `src/` imports).

**MCP:** `extensions/mcp/` (`@sirrelay/mcp` 1.x) — stdio server; one tool `create_task` → `POST /api/v1/client/tasks`. Same Bearer as the extension; does not load the extension.

**Teams:** `extensions/teams/` — sideload ZIP (manifest + icons) embedding the live web board.

## Groups (UI + boundary)

| Peça | Ficheiro | Notas |
|------|----------|-------|
| Switcher + panel open | `group-switcher.tsx` | Desktop dropdown · mobile popover (só um painel visível por breakpoint) |
| Lista + forms | `group-panel-menu.tsx` | Switch/create/join + accept/decline pending requests · leave/delete in `group-danger-settings.tsx` |
| Server actions | `app/actions/groups.ts` + `invitations.ts` | Group lifecycle + consent-based invitation responses |
| Teammate actions | `app/actions/teammates.ts` | invite/update/remove/promote/demote/transfer-ownership/regenerate-invite |
| Tipos | `UserGroup` | `Group & { role }` — paridade `GET /groups` (`ownerUserId` on `Group`) |
| Mock | `services/mock/groups.mock.ts` | `listForUser` devolve roles · leave/delete/transfer · ownership succession |
| Projects (P3-16) | `/projects` tab (`ProjectsManager`) · `tasks.project_id` · `tasks.category_id` | [REQUIREMENTS §7.2](./REQUIREMENTS.md#72-group-projects-p3-16) |
| Email (P3-17) | `lib/mail` · contact · verify (GET+POST) / reset tokens | [REQUIREMENTS §7.3](./REQUIREMENTS.md#73-transactional-email-p3-17) · ImprovMX inbound · Resend outbound |
| Invitation consent | `services/{api,mock}/invitations*` | Existing active account: pending → accept/decline; membership only on accept |
| Auto-select / resume | `api/membership.ts` · `users.last_active_group_id` | 1 grupo → auto · 2+ → último grupo no login |
| Auto-select 1 grupo | `groups/auto/route.ts` | Cookie write (Route Handler, não RSC) |

Fluxo invite inválido: erro no formulário, header intacto (sem redirect/cookies flash).

**Invite + activation:** new email → `users` row `account_status: invited` + membership + invite link. Existing active email → `group_invitations` request only; acceptance creates membership. **Sign-up email merge (P1-AUTH-13):** signup with an `invited` email activates that row and picks the group (P1-AUTH-14).

## Routes

| Route | Auth | Cache | Notes |
|-------|------|-------|--------|
| `/[locale]` | Public | CDN-friendly | Landing; redirects if session |
| `/[locale]/login`, `/signup` | Public | CDN-friendly | Account sign-in / sign-up |
| `/[locale]/forgot-password`, `/reset-password` | Public | CDN-friendly | Password reset (P3-17) |
| `/[locale]/verify-email`, `/check-email` | Public | CDN-friendly | GET confirm · POST consume · `?email=` locks resend (P3-17) |
| `/[locale]/contact` | Public | CDN-friendly | Contact form → `CONTACT_EMAIL` |
| `/[locale]/privacy`, `/terms`, `/join/[token]` | Public | CDN-friendly | Legal · group invite activation |
| `/[locale]/groups` | Session | private | No active group — panel opens automatically |
| `/[locale]/groups/auto` | Session | private | Auto-pick sole group (persist cookie) |
| `/[locale]/change-password` | Session | private | Forced / optional password change |
| `/[locale]/tasks`, `/tasks/new`, `/tasks/[id]` | Session + group | private | Boards, list, CRUD |
| `/[locale]/teammates`, `/teammates/new`, `/teammates/[id]` | Session + group | private | List/detail both roles (writes operator); `/new` operator |
| `/[locale]/projects` | Session + group | private | Project manager (both) · project writes operator · categories both |
| `/[locale]/events`, `/events/activity`, `/settings` | Session + group | private | Alerts (both) · group activity + alert prefs (operator) |
| `/[locale]/platform/login`, `/platform`, `/platform/audit`, … | Platform ops cookie | private | SirRelay platform admin (env credentials; not group chrome) |
| `/[locale]/profile` | Session | private | Account (accessible without active group) |
| `/[locale]/profile/delete` | Session | private | Hard-delete account confirm (P1-AUTH-15) |
| `/[locale]/connect` | Session | private | Link token for VS Code / Cursor extension and MCP (`SIRRELAY_TOKEN`) |
| `/[locale]/vscode/connect` | Session | private | Legacy redirect → `/connect` |

**Backend (Phase 1–2 + P3-17):** Prisma + server actions · `/api/v1/health` · Telegram webhook · `/api/v1/client/*` (bearer board/tasks for the editor extension and MCP) · SEC base + CSRF Origin guard in `proxy.ts` · outbound mail (`lib/mail` / Resend) · platform admin `/platform` · request id on security/auth logs (P2-MON-01) · ops runbook [DEPLOY](./DEPLOY-DIGITALOCEAN.md) (P2-OPS).

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

**User model:** one **account** per person → zero or more **groups** → **role per membership** (`operator` / `teammate`) + optional per-membership **`display_name`** (fantasy label; own edit on **Settings**, operator edit on member detail). Each group has an invisible **`owner_user_id`** (creator by default; transferable; succession on owner leave). Session: `{ user, activeGroupId }`; effective role from `hydrateSession()` + `group_memberships`. Account `users.name` is account-owner-only (Profile); operators must not mutate it. **Telegram** is account-scoped on Profile (`telegram_chat_id` on `users`) — **task relay** for any linked assignee; operators **also** get alert DMs. Group UI label: `display_name ?? users.name` (invited pending → show email). `UserGroup` in `domain/types.ts` matches `GET /groups` (id, name, ownerUserId, role).

**Add teammate:** email-only invite / consent invitation; person sets account name on `/join/<token>` or signup with the same email (P1-AUTH-13).

## Landing demo

Demo seed: `src/services/mock/data.ts` · `sam@example.com` / `SirRelay1` (api / prod-local) · 2 groups → login resume **Demo Shop** · `ana@example.com` (active teammate → tasks) · activation: `mock-invite-carla` for invited Carla.

## Task queue & boards

- Order helpers: `src/lib/task-queue.ts` · check: `npm run check:queue`
- Persist queue: `placeInTodoQueue` (server action / sync layer)
- UI: `TodoReorderList` + `resolveTodoDropIndex` — drop inside `[data-todo-scroll]` = insert by Y; outside = append
- Team board column order: self first, then others by To do count when Tasks opens; order held in client state; quick-add skips `/tasks` revalidate

## Task forms

`src/components/tasks/task-form/` — `TaskFormFields`, `TaskFormActions`, `CreateTaskForm`, `EditTaskForm`. Create: title → assignee → project (+ category when set) → difficulty → due → description. Edit adds status + delete.

## Mock → API

| Camada | Mock | API (prod-local / VPS) |
|--------|------|------------------------|
| Entrada | `getServices()` → `mock/*` | `getServices()` → `api/*` |
| Sessão | Cookie `sirrelay_mock_session` | jose + httpOnly cookie |
| Grupos | `MockGroupService` | Prisma `group_memberships` |
| Actions | `app/actions/*` | Mode-agnostic — chamam `getServices()` |

**API layer:** `src/services/api/` — Prisma-backed implementations of `contracts.ts`. Run via **prod-local** or **VPS** (`NEXT_PUBLIC_SERVICE_MODE=api`). Health: `GET /api/v1/health` · Telegram: `POST /api/v1/telegram/webhook` · Clients: `GET/POST/PATCH /api/v1/client/*` (bearer). The web UI uses server actions; the VS Code / Cursor extension and MCP use the client routes. Ambientes: [ENVIRONMENTS.md](./ENVIRONMENTS.md).

## Session & security (Phase 2 SEC)

| Peça | Onde | Notas |
|------|------|-------|
| Session cookie | `session-cookie.ts` | JWT httpOnly · `SameSite=Lax` · payload inclui `tokenVersion` |
| Revocation | `users.token_version` | Incrementa em logout + change password; hydrate rejeita mismatch |
| Lockout | `users.failed_login_count` / `locked_until` | 5 falhas → 15 min; erros de login genéricos |
| Password set | `password-policy.ts` | 8 + maiúscula + número + denylist; login grandfather |
| CSRF | `csrf-origin.ts` + `proxy.ts` | POST/… sem Origin/Referer same-origin → 403; webhook `/api` fora do matcher |
| Rate limit | `rate-limit.ts` + `proxy.ts` | login/signup/platform/login 10/min/IP · other POSTs 100/min/IP → 429 + Retry-After |
| Telegram in | `telegram/sanitize.ts` | Strip C0/C1 controls on replies + `/start` codes before persist/parse |
| Dep audit | README · `audit:prod` | Next 16.2 · no high in prod; Image Optimizer off; nested postcss moderate |
| Safe log | `safe-log.ts` · `request-context.ts` | JSON + redaction; `requestId` from ALS / `x-request-id` (P2-MON-01). No per-hit access log |
| IDOR | `authz.ts` + services | Operator: export · alert prefs · invites; any member: alert list; self: profile mutations; tasks: `loadTask` |
| Headers | `security-headers.ts` + `proxy.ts` | HSTS (prod HTTPS), frame deny, nosniff, referrer, CSP |
| Audit store | `lib/audit.ts` · `audit_logs` | Append-only write + `queryAuditLogs` (cross-group for platform admin). Incl. login |
| Group activity | `domain/activity.ts` · `lib/activity.ts` · `/events/activity` | Filtered human-language history for operators (no login) |
| Platform admin | `/platform/login` · env `PLATFORM_ADMIN_*` · cookie `sirrelay_platform_session` | Separate from product login; Overview · Audit · Users · Groups · Health |
| Checks | `check:sec` · `check:csrf` · `check:rate` · `check:email-tokens` · `check:telegram-sanitize` · `check:safe-log` · `check:authz` · `check:audit` · `check:platform-session` · `audit:prod` | |

## Session sync

`SyncProvider` wraps the signed-in app (mock and API). Optimistic UI + mutation queue; sync bar on failure. Full offline conflict UX remains Phase 3 (P3-07). Refresh discards unsent changes.

## Run

```bash
npm install && npm run dev-mock && npm run check:routes
# full stack: npm run prod-local   # API + Postgres · SirRelay1
```

`http://localhost:3000` (mock) · `http://localhost` (prod-local) — **mock:** `sam@example.com` (any password) · **api:** `sam@example.com` / `SirRelay1` · activation: `mock-invite-carla` as carla@example.com
