# SirRelay

**SirRelay** is an app by **Sir** — a self-hosted task relay for small teams.

One web app, two roles: the **Operator** runs everything; each **Teammate** works on their own tasks. On **Telegram**, the bot delivers **one task at a time** — reply `done` and the next task in the queue is sent automatically.

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
4. [**docs/BRAND.md**](./docs/BRAND.md) — colors, logos, visual tokens

For deployment, read [**docs/DEPLOY-DIGITALOCEAN.md**](./docs/DEPLOY-DIGITALOCEAN.md) after the above.

---

## Documentation (`docs/`)

| File | Contents | When to read |
|------|----------|--------------|
| [**REQUIREMENTS.md**](./docs/REQUIREMENTS.md) | Full spec: roles, relay queue, tasks, Telegram, phases 1–3, schema, API, permissions | **Always** — before any product feature or bugfix |
| [**UIUX.md**](./docs/UIUX.md) | Shell, boards (Operator vs Teammate), cards, forms, empty states, components | When changing pages, layout, or UI flows |
| [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) | `src/` layout, mock routes, `getServices()`, sync, task forms | When changing structure, services, or mock/API integration |
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
| **Operator** | Web: manage teammates, create tasks (for teammates **or themselves**), view Kanban/list of everything · optional Telegram for **alerts** (task completed, due/overdue) |
| **Teammate** | **Telegram** (primary): receive one task, reply, mark progress with keywords · **Web** (optional): view and update **only their** tasks |

### Relay flow

1. Operator creates a teammate and sends invite + Telegram link  
2. Teammate activates the account and links Telegram  
3. Operator creates tasks assigned to the teammate — **only the first** is sent on Telegram (queue)  
4. Teammate **replies** to the message (e.g. `done`, `feito`) → task becomes `done` → **next task arrives on Telegram**  
5. Operator and Teammate see the same state on the web  

Hosting: **DigitalOcean Droplet** (EU) — Docker Compose, PostgreSQL, Caddy (HTTPS). See [docs/DEPLOY-DIGITALOCEAN.md](./docs/DEPLOY-DIGITALOCEAN.md).

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

**UI mock phase — complete.** Full web UI with mock data and in-memory services. Phase 1 backend (Prisma, API, Telegram) not started.

Main routes: `/admin`, `/join/[token]`, `/change-password`, `/privacy`, tasks, teammates (with export), alerts, profile, settings. See [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

```bash
npm install
npm run dev
npm run check:routes   # verify entry redirects
```

Open `http://localhost:3000` · sign in at `/admin` (`alex@example.com` — change password first · `sam@example.com` · `ana@example.com`, any password).

---

## License

TBD.
