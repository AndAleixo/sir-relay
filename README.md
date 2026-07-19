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
| **Operator** (in a group) | Web: manage members, create tasks, view Kanban/list · Telegram: **task relay** when assigned + **alerts** |
| **Teammate** (in a group) | **Telegram** (primary): one task at a time · **Web**: view and update **only their** tasks |

### Relay flow

1. Operator **pre-creates** a teammate (email) and sends the **invite link**  
2. Teammate **activates** via invite **or** sign-up with the same email → links Telegram on **Profile**  
3. Operator creates tasks — **any linked assignee** (teammate or operator) gets **at most one** active Telegram task (queue)  
4. Assignee **replies** to the message (e.g. `done`, `feito`) → task becomes `done` → **next task arrives on Telegram**  
5. Everyone sees the same state on the web  

Hosting: **DigitalOcean Droplet** (EU) with a **public domain** — Docker Compose, PostgreSQL, Caddy (HTTPS). Daily DB backup to Google Drive (`scripts/db/backup-offsite.sh`, cron 05:00). See [docs/DEPLOY-DIGITALOCEAN.md](./docs/DEPLOY-DIGITALOCEAN.md) (§9.1 backups).

**Future:** native iOS/Android apps (Phase 3) will use the same API — web is the primary client for now.

Languages: **English (UK), Spanish (Spain), and Portuguese (Brazil)** (`en-gb`, `es-es`, `pt-br`).

---

## Stack (summary)

- **Next.js** (App Router) + TypeScript + React
- **PostgreSQL** + Prisma
- **Telegram** (grammy, webhook)
- **Docker Compose** + Caddy

Details in [REQUIREMENTS.md §10](./docs/REQUIREMENTS.md#10-tech-stack--repo-layout).

---

## Project status

**UI mock complete** — landing + app shell + group panel (switch/create/join); leave/delete in Settings; promote on teammate detail. **Phase 1 backend (Prisma + `services/api`)** — use **dev-hybrid** with Postgres.

| Ambiente | Comando | Estado |
|----------|---------|--------|
| Dev mock | `npm run dev-mock` | Active — in-memory, any password |
| Dev híbrido | `npm run dev-hybrid` | Active — Postgres + API, `SirRelay1`, resume last group |
| Prod local / VPS | `npm run prod-local` | Pending — smoke Docker app |

```bash
npm install && npm run dev-mock && npm run check:routes
```

Open `http://localhost:3000` · demo: `sam@example.com` · `ana@example.com` (tasks) · promote Ana → Sam can leave group · signup → `/groups`

---

## Dependency audit (P2-SEC-10)

`npm audit` reports **known security advisories** in installed packages — **not** “deprecated” warnings.

```bash
npm run audit:prod   # same as: npm audit --omit=dev
```

**Deploy rule:** no **critical** in prod deps. **High** → upgrade if possible without a major break; otherwise record and schedule.

**Today:** still **high** on Next 14 (and moderate on next-intl/postcss). Clearing them needs a **Next 15/16** upgrade — not done yet. Until then we stay on latest 14.2 and keep Image Optimizer off (`next.config.mjs`) because the app does not use `next/image`.

---

## License

TBD.
