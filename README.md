# SirRelay

Hosted **web** task tool for small groups (by **Sir**), with optional **Telegram** relay, an IDE extension (VS Code, Cursor, Antigravity), and **MCP** (`@sirrelay/mcp`). One active Telegram task per assignee; reply `done` → next in queue. No KPI dashboards.

Editor / MCP: **`/connect`** manages named API keys (optional group scope); Profile links there.

| | |
|---|---|
| Brand / app / repo | **Sir** · **SirRelay** · wordmark **SRelay** / mark **SR** · `sir-relay` |
| Locales | `en-gb` · `es-es` · `pt-br` |
| Visual identity | [docs/BRAND.md](./docs/BRAND.md) |
| Telegram bot | SRelay (e.g. `@SirRelayBot`) |
| Clients | [VSIX](./extensions/vsix/) · [MCP](./extensions/mcp/) · [Cursor plugin](./extensions/cursor-plugin/) · [Teams](./extensions/teams/) |

**Roles (per group):** Operator manages members/tasks on the web (+ alerts on Telegram). Teammate works mainly on Telegram; web My work / Team (edit own). Details: [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md).

---

## Docs (read before changing code)

| File | Use for |
|------|---------|
| [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) | Where code lives · services · mock → API |
| [**REQUIREMENTS.md**](./docs/REQUIREMENTS.md) | Product rules, IDs, API, permissions |
| [**UIUX.md**](./docs/UIUX.md) | Layout, boards, screens (UI work) |
| [**ENVIRONMENTS.md**](./docs/ENVIRONMENTS.md) | Dev mock · prod local · how to run |
| [**BRAND.md**](./docs/BRAND.md) | Colors, logos, tokens (UI work) |

Ops / publish (only when needed): [DEPLOY-DIGITALOCEAN.md](./docs/DEPLOY-DIGITALOCEAN.md) · [extensions/mcp/PUBLISH.md](./extensions/mcp/PUBLISH.md) · [PRODUCT.md](./PRODUCT.md) (landing / Impeccable).

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

```bash
npm run audit:prod   # npm audit --omit=dev (P2-SEC-10)
```

---

## License

SirRelay is [FSL-1.1-MIT](./LICENSE). Copyright 2026 Andre Aleixo.

You may use, modify, and share it for any purpose except a Competing Use: offering SirRelay, or something with the same function, as a commercial product or service to others. Internal use is allowed. Two years after a version is published, that version is available under the MIT license. See [NOTICE](./NOTICE) for third-party material.

Contributions are accepted under the same terms.

## Security

Report vulnerabilities to contact@sirrelay.com. Do not open a public issue for a security report.
