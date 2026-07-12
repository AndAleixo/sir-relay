# SirRelay

**SirRelay** is an app by **Sir** — a **hosted web task relay** for small groups.

Create an account, join or start a **group**, then work as **Operator** or **Teammate** inside that group. On **Telegram**, the bot delivers **one task at a time** — reply `done` and the next task in the queue is sent automatically. **No dashboards, no performance metrics** — calm coordination, not surveillance.

| | |
|---|---|
| **Brand** | Sir |
| **App** | SirRelay |
| **Repository** | `sir-relay` |
| **Colors** | Yellow `#EAB308` + gray + black + white — [docs/BRAND.md](./docs/BRAND.md) |
| **Icon** | `brand/icon.svg` — yellow square + **SirR** |
| **Compact logo** | `brand/logo-compact.svg` — **SirR** + line |
| **Full logo** | `brand/logo.svg` — **SirRelay** + line |
| **Telegram bot** | SirRelay (e.g. `@SirRelayBot`) |

---

## Before you change the code

**Any developer or LLM modifying this repository must read the documentation in [`docs/`](./docs/) before writing code.**

These files define the product, UI, architecture, and brand. Skipping them leads to inconsistent implementations, out-of-scope features, or visual regressions. Recommended reading order:

1. [**docs/REQUIREMENTS.md**](./docs/REQUIREMENTS.md) — what the product does, business rules, phases, API, permissions (**source of truth**)
2. [**docs/UIUX.md**](./docs/UIUX.md) — layouts, boards, screens, interactions, components
3. [**docs/ARCHITECTURE.md**](./docs/ARCHITECTURE.md) — code structure, mock routes, mock → API
4. [**docs/ENVIRONMENTS.md**](./docs/ENVIRONMENTS.md) — four environments: dev mock · dev hybrid · prod local · prod VPS
5. [**docs/BRAND.md**](./docs/BRAND.md) — colors, logos, visual tokens

For deployment, read [**docs/DEPLOY-DIGITALOCEAN.md**](./docs/DEPLOY-DIGITALOCEAN.md) after the above.

---

## Documentation (`docs/`)

| File | Contents | When to read |
|------|----------|--------------|
| [**REQUIREMENTS.md**](./docs/REQUIREMENTS.md) | Full spec: roles, relay queue, tasks, Telegram, phases 1–3, schema, API, permissions | **Always** — before any product feature or bugfix |
| [**UIUX.md**](./docs/UIUX.md) | Shell, boards (Operator vs Teammate), cards, forms, empty states, components | When changing pages, layout, or UI flows |
| [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) | `src/` layout, mock routes, `getServices()`, sync, task forms | When changing structure, services, or mock/API integration |
| [**ENVIRONMENTS.md**](./docs/ENVIRONMENTS.md) | Dev mock · dev hybrid · prod local · prod VPS; env vars; workflow | When setting up local DB, Docker smoke test, or planning deploy |
| [**BRAND.md**](./docs/BRAND.md) | Sir identity, icons vs logos, palette, CSS tokens | When changing colors, typography, logos, or visual components |
| [**DEPLOY-DIGITALOCEAN.md**](./docs/DEPLOY-DIGITALOCEAN.md) | DigitalOcean Droplet deploy: Docker Compose, PostgreSQL, Caddy, HTTPS | When preparing or updating production |

Development is split into **3 phases** — see [REQUIREMENTS.md §3](./docs/REQUIREMENTS.md#3-development-phases):

- **Phase 1** — Relay workflow + deploy (usable product)
- **Phase 2** — Security, audit log, VPS hardening
- **Phase 3** — New features (backlog)

---

## What it is

Distributes operational tasks and tracks progress in one place — web for the full picture, Telegram for fast day-to-day work.

| Role | How they use it |
|------|-----------------|
| **User** | Creates an account, then **creates a group** or **joins one by invite** |
| **Operator** (in a group) | Web: manage members, create tasks, view Kanban/list · optional Telegram for **alerts** |
| **Teammate** (in a group) | **Telegram** (primary): one task at a time · **Web**: view and update **only their** tasks |

### Relay flow

1. Operator creates a teammate and sends invite + Telegram link  
2. Teammate activates the account and links Telegram  
3. Operator creates tasks assigned to the teammate — **only the first** is sent on Telegram (queue)  
4. Teammate **replies** to the message (e.g. `done`, `feito`) → task becomes `done` → **next task arrives on Telegram**  
5. Operator and Teammate see the same state on the web  

Hosting: **DigitalOcean Droplet** (EU) with a **public domain** — Docker Compose, PostgreSQL, Caddy (HTTPS). Visitors land on a marketing page; signed-in users get the app. See [docs/DEPLOY-DIGITALOCEAN.md](./docs/DEPLOY-DIGITALOCEAN.md).

**Future:** native iOS/Android apps (Phase 3) will use the same API — web is the primary client for now.

Languages: **English, Spanish, and Portuguese** (`en`, `es`, `pt`).

---

## Stack (summary)

- **Next.js** (App Router) + TypeScript + React
- **PostgreSQL** + Prisma
- **Telegram** (grammy, webhook)
- **Docker Compose** + Caddy

Details in [REQUIREMENTS.md §10](./docs/REQUIREMENTS.md#10-tech-stack--repo-layout).

---

## Project status

**UI mock complete** — landing + app shell + group panel. **Phase 1 backend (Prisma + `services/api`)** implemented — use **dev-hybrid** with Postgres for real persistence.

| Ambiente | Comando | Estado |
|----------|---------|--------|
| Dev mock | `npm run dev-mock` | ✅ in-memory |
| Dev híbrido | `npm run dev-hybrid` | ✅ Postgres + API · login `demo12345` |
| Prod local / VPS | `npm run prod-local` | ⏳ smoke Docker app |

```bash
npm install && npm run dev-mock && npm run check:routes
```

Open `http://localhost:3000` · demo: `sam@example.com` (2 groups) · `ana@example.com` (tasks) · invite: `mock-invite-ana-side` as ana · signup → `/groups`

---

## License

TBD.
