# Product

<!-- impeccable:product-schema 1 -->

## Platform

web, vscode-extension, mcp

## Users

Primary audiences (either is valid; marketing names both):

1. Someone who wants to **manage their own tasks** — create a group for themselves, assign work to self, follow progress without productivity theater.
2. Someone who wants to **run a group** — invite teammates by email, assign work, and monitor shared progress on the web.

Secondary: **teammates** who join via invite (or sign up with the invited email), use the web for their work, and may optionally link chat for updates.

Situation: people coordinating work alone or with others (often ops / floor / away-from-desk texture) without project-management overhead or productivity surveillance. People often juggle more than one task on the web; marketing must not claim exclusive one-at-a-time usage. Group size is not a product limit.

## Product Purpose

**SirRelay** is a hosted web task tool: one account, work inside a **group**, with role (`operator` / `teammate`) per group. You can use a group solo for your own tasks, or invite others and share the same task truth. Optional chat delivery exists in the product (today Telegram) but is not the landing story.

Success: you can keep your own work clear, or invite and follow group work — tasks and due dates only, without dashboards or metric pressure.

## Positioning

**Primary differentiator (honest):** subtraction + clarity for real work.

SirRelay is for **who wants to manage work** — their own tasks, or a group’s. The product shows **tasks and due dates** and refuses productivity theater — no leaderboards, velocity charts, or “who is behind” scores. That refusal is product truth, not a slogan.

**Texture:** work that often happens away from a desk (ops, floor, stock, suppliers) — use as scene, not as a hard vertical lock.

**Not the landing center:** one-at-a-time usage, channel locks (Telegram / chat brands), “small teams only,” operator-only exclusivity, or feature-war comparisons with generic kanban tools. Chat remains optional and channel-agnostic in marketing; in-app copy may name the current channel.

## Operating Context

- Marketing landing at `/[locale]` for logged-out visitors (try demo / signup / login) — solo + group, anti-KPI story.
- Try demo (`/demo`) opens the app shell with a seed kept in the browser tab. Creating an account does not import it.
- Signed-in web app: Tasks (board/list), Teammates, Projects, Events, Settings (group), Profile (account).
- VS Code / Cursor extension: the signed-in user’s column in the sidebar (same tasks as the web; project filter).
- MCP (`extensions/mcp`, `@sirrelay/mcp`): create a task from an AI client. Same link token and bearer API as the editor (`/[locale]/connect` · `/api/v1/client/*`); extension not required.
- Teams package (`extensions/teams`): optional custom/sideload ZIP embedding the web board — not a public store listing unless a company Partner Center enrollment exists.
- Chat bot for linked members (currently Telegram): task delivery, status replies, operator alerts.
- Invite by email only; activation via `/join/<token>` or signup with the same email.
- Locales: `en-gb`, `es-es`, `pt-br`.
- Hosted publicly (DigitalOcean + HTTPS); data in PostgreSQL.

## Capabilities and Constraints

- Group-scoped work; active group via header switcher.
- Operators manage members/tasks; teammates edit own work and may create self-assigned tasks.
- No web comment thread; no metric dashboards in product scope.
- Relay applies to any linked group member (teammates and operators) — implementation detail, not marketing headline.
- Phase model: Phase 1 = workflow + deploy; later phases add polish (e.g. deeper a11y) and native apps — not invent here.
- Undecided for Impeccable: formal accessibility conformance level (see Accessibility).

## Brand Commitments

- **Brand:** Sir · **Product:** SirRelay · **Wordmark:** SRelay · **Mark:** SR.
- Voice: calm, direct — avoid KPI / “10× productivity” language.
- Anti-metric positioning is product truth (FAQ and product principles), not a visual recipe.
- Landing stays channel-agnostic; prefer not to lead with “chat.” In-app copy may name Telegram.
- Landing and product UI share the same brand system in the incumbent implementation (`docs/BRAND.md`, `docs/UIUX.md`).

## Evidence on Hand

- Product demo on landing: board preview / `/brand/demo.webm` with CSS fallback (ops-flavored sample tasks).
- FAQ copy covering what SirRelay is, groups, anti-KPI stance, data storage.
- Specs: `docs/REQUIREMENTS.md`, `docs/UIUX.md`, `docs/BRAND.md`, `docs/ARCHITECTURE.md`.
- Do **not** fabricate testimonials, customer logos, benchmarks, pricing claims, or press quotes.

## Product Principles

1. **Your work, or the group’s** — Landing serves solo task management and group operators equally — not a generic “team productivity” pitch.
2. **Calm competence** — Trust comes from clarity and restraint; never from urgency theater or productivity theater.
3. **Tasks and due dates only** — No leaderboards, velocity, or surveillance KPIs in product scope.
4. **Same truth for the group** — Web shows the shared picture; optional chat must not invent a second reality.
5. **Human-scale, any group size** — Readable and clear for real teams — not enterprise fleet management theater, and not a 2–5-person ceiling in product story.

## Accessibility & Inclusion

No product-mandated WCAG level confirmed yet. Phase 1 ships usable keyboard/focus patterns where built; deeper Kanban a11y is noted as later polish in requirements. Record a target here when the team chooses one.
