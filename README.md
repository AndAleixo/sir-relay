# SirRelay

Hosted **web** task tool for small groups (by **Sir**), with optional **Telegram** relay, **VS Code / Cursor** extension, and **MCP** (`@sirrelay/mcp`). One active Telegram task per assignee; reply `done` → next in queue. No KPI dashboards.

Editor / MCP: **Profile → API keys** (named keys, optional group scope; `/connect` creates/replaces the Editor key).

| | |
|---|---|
| Brand / app / repo | **Sir** · **SirRelay** · wordmark **SRelay** / mark **SR** · `sir-relay` |
| Locales | `en-gb` · `es-es` · `pt-br` |
| Visual identity | [docs/BRAND.md](./docs/BRAND.md) |
| Telegram bot | SRelay (e.g. `@SirRelayBot`) |
| Clients | [VS Code](./extensions/vscode/) · [MCP](./extensions/mcp/) · [Cursor plugin](./extensions/cursor-plugin/) · [Teams](./extensions/teams/) |

**Roles (per group):** Operator manages members/tasks on the web (+ alerts on Telegram). Teammate works mainly on Telegram; web My work / Team (edit own). Details: [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md).

---

## Docs (read before changing code)

| File | Use for |
|------|---------|
| [**REQUIREMENTS.md**](./docs/REQUIREMENTS.md) | Product rules, phases, IDs, API, permissions |
| [**UIUX.md**](./docs/UIUX.md) | Layout, boards, screens, interactions |
| [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) | `src/`, services, mock → API |
| [**ENVIRONMENTS.md**](./docs/ENVIRONMENTS.md) | Dev mock · prod local · VPS |
| [**BRAND.md**](./docs/BRAND.md) | Colors, logos, tokens |
| [**DEPLOY-DIGITALOCEAN.md**](./docs/DEPLOY-DIGITALOCEAN.md) | Production Droplet: firewall, SSH, deploy, backups, monthly updates (P2-OPS) |

Phases 1–3: [REQUIREMENTS §3](./docs/REQUIREMENTS.md#3-development-phases).

---

## Run locally

```bash
npm install && npm run dev-mock && npm run check:routes
```

Open `http://localhost:3000` · demo `sam@example.com` / `ana@example.com` (any password in mock).

| Environment | Command |
|-------------|---------|
| Dev mock | `npm run dev-mock` |
| Prod local (Docker stack) | `npm run prod-local` |
| Prod VPS | `bash scripts/env/prod-vps.sh` |

Stack: Next.js 16 · React 19 · Prisma · PostgreSQL · grammy · Docker Compose + Caddy — [REQUIREMENTS §10](./docs/REQUIREMENTS.md#10-tech-stack--repo-layout).

**Production ops:** [DEPLOY-DIGITALOCEAN.md](./docs/DEPLOY-DIGITALOCEAN.md) — firewall, `.env` `chmod 600`, backups, monthly OS/image updates (P2-OPS-01–09).

---

## Dependency audit (P2-SEC-10)

```bash
npm run audit:prod   # npm audit --omit=dev
```

No **critical** in prod deps. **High** → upgrade if safe, else record. On Next 16.2: no critical/high; remaining moderate nested `postcss` (no safe bump without force). Image Optimizer off — app does not use `next/image`.

---

## License

SirRelay is [FSL-1.1-MIT](./LICENSE). Copyright 2026 Andre Aleixo.

You may use, modify, and share it for any purpose except a Competing Use: offering SirRelay, or something with the same function, as a commercial product or service to others. Internal use is allowed. Two years after a version is published, that version is available under the MIT license. See [NOTICE](./NOTICE) for third-party material.

Contributions are accepted under the same terms.

## Security

Report vulnerabilities to contact@sirrelay.com. Do not open a public issue for a security report.
