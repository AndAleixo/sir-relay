# SirRelay — UI/UX

**Purpose:** Layout, interaction, and visual behavior for the **public landing**, signed-in web app, and Telegram experience.  
**Companion docs:** [REQUIREMENTS.md](./REQUIREMENTS.md) (what must work) · [BRAND.md](./BRAND.md) (colors, logos, tokens) · [ARCHITECTURE.md](./ARCHITECTURE.md) (code layout)

**Last updated:** 2026-07-12

### Status naming

One convention everywhere:

| Layer | Values |
|-------|--------|
| **Code / DB / API** | `todo` · `doing` · `done` |
| **UI (en)** | To do · In progress · Done |
| **UI (es)** | Por hacer · En progreso · Hecho |
| **UI (pt)** | A fazer · Em progresso · Concluído |

Never use `in_progress` in code. UI copy never says “Doing” — always **In progress** (or locale equivalent).

---

## 1. Design principles

| Principle | Application |
|-----------|-------------|
| **Relay-first** | Telegram is the fast path; web shows the same truth without extra steps |
| **Group context** | One **user account**; **role** (`operator` / `teammate`) is shown and enforced **in the active group** — same person may operate one team and work as teammate in another |
| **To do + In progress first** | Active work is always visible; Done is secondary on the Operator board |
| **Calm UI** | Gray/white surfaces; yellow accent for CTAs and In progress column |
| **No metric pressure** | No velocity charts, leaderboards, or surveillance KPIs — tasks and due dates only |
| **Small team scale** | 2–5 people per group; no enterprise density — readable cards, generous spacing |
| **Account vs app config** | **Profile** = personal account (photo, name, language, Telegram, password) · **Settings** = group alerts, membership (leave/delete) |
| **Web first** | Responsive web is the primary client; landing and app share brand tokens; native apps reuse API later |

### 1.1 Users, groups, and roles

```
User (account)
  ├── Group A — operator  →  nav: Tasks · Teammates · Alerts · Settings
  └── Group B — teammate →  nav: Tasks · Settings
```

| Concept | UX |
|---------|-----|
| **User** | Email + password; signs up at `/signup`; not labelled “operator” or “teammate” globally |
| **Group** | Team workspace; **create inline** in header group panel or join via invite (`/join/[token]` or panel paste) |
| **Role** | Per group; shown in **group switcher** only |
| **Active group** | Session selection; all app screens (tasks, teammates, alerts) are scoped here |
| **Switch / manage groups** | Header **group switcher** panel — switch, create, join with invite (dropdown anchored below trigger) |

**Post-login flow:** sign up / log in → (password change if bootstrap only) → **no group** → `/groups` (panel opens) → create or join → operator → `/teammates` · teammate → `/tasks`.

---

## 2.0 Marketing landing

Public page at `/[locale]` for logged-out visitors. Implemented in `src/components/landing/`.

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  logo.svg          [EN · ES · PT]              [ Log in ]    │  ← sticky header
├──────────────────────────────────────────────────────────────┤
│  Eyebrow · Headline · Subtitle                               │
│  [ Get started ]  [ How we handle data ]                     │
│                                                              │
│  ┌─ browser chrome ─────────────────────────────────────┐   │
│  │  Product demo (demo.webm · CSS board fallback)       │   │
│  └──────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│  3 feature cards — simple · no metrics · one task at a time  │
├──────────────────────────────────────────────────────────────┤
│  © Sir · SirRelay    FAQ · Privacy · Terms · Log in · Sign up │  ← footer
└──────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Header | Sticky; logo links home; locale links; **Sign up** (ghost) + **Log in** → `/[locale]/signup` · `/login` |
| Hero | Value prop: calm team coordination, no KPI pressure; primary CTA **Create account** → `/signup` |
| Demo | Browser frame with **`/brand/demo.webm`** (autoplay, muted, loop); CSS board fallback if video fails |
| Features | Three cards — simple to run · no metric pressure · one task at a time (Telegram relay) |
| FAQ | `#faq` — groups, metrics, Telegram, data/cache (public pages CDN-friendly; signed-in pages `no-store`) |
| Footer | Copyright, FAQ, Privacy, Terms, Log in, Sign up — shared `SiteFooter` on auth/legal pages |
| App store badges | **None** in Phase 1 (P3-13) |

**Voice:** Reassuring, plain language — “manage without pressure”, not “boost productivity 10×”.

**Logged-in users:** `/[locale]` redirects to app home per [ARCHITECTURE.md](./ARCHITECTURE.md#entry-redirects).

---

## 2.1 Auth & group entry (pre-shell)

Pages outside the main app shell — centred card layout (`authShellStyles`), `SiteFooter`, optional **`AuthPageHeader`** (logo + “Back to home” → landing).

| Page | Route | Header | Purpose |
|------|-------|--------|---------|
| Sign up | `/signup` | Yes `AuthPageHeader` | New account → `/groups` (no group yet) |
| Log in | `/login` | Yes `AuthPageHeader` | Existing account → role home or `/groups` |
| Join group | `/join/[token]` | Yes `AuthPageHeader` | New teammate: set password · existing account → accept |
| Privacy / Terms | `/privacy`, `/terms` | Yes `AuthPageHeader` | Legal stubs |
| No active group | `/groups` | App shell | Placeholder copy; **group panel opens** automatically |

**Group panel** (header switcher) — switch · **create** · **join**. Leave/delete live on **Settings** (`/settings`).

```
┌─ Group panel (header switcher) ─────┐
│  Demo Shop              * Operator  │
│  Side Project              Teammate │
├─────────────────────────────────────┤
│  Create group          (expand)     │
│  Join with invite      (expand)     │
└─────────────────────────────────────┘
```

- **Empty state:** expand create **or** join
- **Single group, no active:** `/groups/auto` persiste cookie → role home (sem ficar em `/groups`)
- **2+ groups, no active:** `/groups` + panel open on visible switcher (desktop + mobile)
- **Invite errors:** inline no formulário (sem reload); link inválido / email mismatch
- **Mobile panel:** dropdown ancorado abaixo do trigger (não bottom sheet)
- **Invite:** adds membership if missing (same email as invite)
- **Join (new account):** `/join/[token]` — set password
- **Existing account added by operator (same email):** membership added; group appears in switcher

---

## 2.2 App shell

Same chrome for everyone; **navigation and default view depend on role in the active group**.

### Desktop (≥768px)

```
┌────────────┬──────────────────────────────────────────────────┐
│ logo.svg   │  [Group ▾]              [locale ▾] [avatar] [▾] │
│ ────────── │  Page title                    [+ New task]*      │
│  Tasks     │  ─────────────────────────────────────────────  │
│  Teammates*│                                                   │
│  Alerts*   │              Main content                         │
│  Settings  │                                                   │
│            │                                                   │
│ ────────── │                                                   │
│ Ana        │  ← footer links to Profile                        │
│      [◀]   │  ← collapse toggle (logo → logo-compact.svg)    │
└────────────┴──────────────────────────────────────────────────┘

* Operator only          Teammate nav: Tasks · Settings
```

| Element | Spec |
|---------|------|
| Sidebar | Fixed left; collapsible (`w-56` ↔ `w-20`); preference stored in `localStorage` |
| Sidebar logo | `logo.svg` expanded · `logo-compact.svg` collapsed; cross-fade animation |
| Sidebar nav | Tasks · Teammates* · Alerts* · Settings — icons + labels (icons only when collapsed) |
| Sidebar footer | Profile link (name + avatar) only |
| Top header | **Group switcher** · locale picker · account menu (avatar + chevron) |
| Account menu (`▾`) | Name · Account · Log out |
| Locale | Custom dropdown in header (same route, new locale prefix); also on login screen |
| Primary CTA | “New task” — Operator only, yellow button per [BRAND.md](./BRAND.md) |

**Post-login landing:** no group → `/groups` · operator in active group → `/teammates` · teammate in active group → `/tasks` (Kanban)

### Mobile (<768px)

Sidebar hidden. Sticky top bar + tab navigation.

```
┌────────────────────────────────────────┐
│ [logo]  [Group ▾]     [EN▾] [avatar]   │
├────────────────────────────────────────┤
│   Tasks    Teammates*    Alerts*    Settings      │  ← icon tabs
├────────────────────────────────────────┤
│              Main content              │
└────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Top bar | Compact logo, **group switcher**, locale switcher (short code), avatar → Profile |
| Tab nav | Same items as sidebar; active tab highlighted |
| Account menu | Desktop only (chevron); mobile uses Profile page for log out |
| Log out | Profile page + desktop account menu |

---

## 3. Task boards — two layouts

Both roles use `/[locale]/tasks` as the default tasks view. Layout is **role-based**, not a user toggle.

### 3.1 Teammate — status Kanban (traditional)

Three columns by **task status** (`todo` · `doing` · `done`). Only tasks **assigned to me**.

```
┌─────────────┬─────────────┬─────────────┐
│   To do     │ In progress │    Done     │
│   (gray)    │  (yellow)   │  (dark gray)│
├─────────────┼─────────────┼─────────────┤
│  [card]     │  [card]     │  [card]     │
│  [card]     │             │  [card]     │
└─────────────┴─────────────┴─────────────┘
```

| Column | Code | Header color | Label (en / es / pt) |
|--------|------|--------------|----------------------|
| To do | `todo` | `--status-todo` | To do / Por hacer / A fazer |
| In progress | `doing` | `--status-progress` | In progress / En progreso / Em progresso |
| Done | `done` | `--status-done` | Done / Hecho / Concluído |

**Card contents:** title (truncate 2 lines), due date (overdue in red), last activity time.

**Interactions:**

- ↗ on card → task detail (edit form)
- Drag between columns to change status (mock implemented; §P3-03)
- Setting status to `done` triggers relay (P1-TASK-12) same as Telegram

**Mobile (375px):** columns stack vertically: To do → In progress → Done.

---

### 3.2 Operator — team board

First column: **Me** (tasks assigned to the logged-in Operator). Then one column per **active teammate**. Inside each column: **To do** and **In progress** expanded; **Done** collapsed.

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│    Me           │    Ana          │    Bruno        │    Carla        │
│  (Sam)          │  ● linked       │  ○ pending TG   │  ● linked       │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ TO DO (1)       │ TO DO (2)       │ TO DO (1)       │ TO DO (0)       │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────┐ │                 │
│ │ task card   │ │ │ task card   │ │ │ task card   │ │  (empty)        │
│ └─────────────┘ │ └─────────────┘ │ └─────────────┘ │                 │
│                 │                 │                 │                 │
│ IN PROGRESS (0) │ IN PROGRESS (1) │ IN PROGRESS (0) │ IN PROGRESS (1) │
│                 │ ┌─────────────┐ │                 │ ┌─────────────┐ │
│                 │ │ task card   │ │                 │ │ task card   │ │
│                 │ └─────────────┘ │                 │ └─────────────┘ │
│                 │                 │                 │                 │
│ ▾ Done (3)      │ ▾ Done (5)      │ ▾ Done (2)      │ ▾ Done (8)      │
│  (collapsed)    │  (collapsed)    │  (collapsed)    │  (collapsed)    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Me column:** Operator self-assigned tasks; web-only (no Telegram relay). Label shows Operator display name or “Me” per locale.

#### Column header (teammate)

- Teammate name (bold)
- Status chips: Telegram `linked` / `pending`, account `active` / `invited`
- Optional: count of `todo` + `doing` as summary badge

#### Sections inside each column (top → bottom)

| Section | Status | Priority | Default state | Max visible |
|---------|--------|----------|---------------|-------------|
| **To do** | `todo` | High | Expanded | All cards |
| **In progress** | `doing` | High | Expanded | All cards |
| **Done** | `done` | Low | **Collapsed** | Count in header; expand shows last **5** cards + “View all” link |

**Visual weight:**

- To do + In progress: full task cards, section labels in normal weight
- Done: collapsed accordion; muted label (`--text-muted`); yellow **not** used in Done section

**Unassigned / deactivated teammates:** hidden from board in mock; list view shows all assignees.

**Horizontal scroll:** drag left/right on the board; native scrollbar at bottom when columns overflow.

**Mobile (375px):** horizontal snap scroll between columns, or switch to list view.

---

### 3.3 List view (both roles)

Toggle in toolbar: **Board** | **List** (icon + label).

| Role | List content |
|------|--------------|
| Teammate | My tasks; sort by due date, status, updated_at |
| Operator | All tasks; columns: title, assignee, status, due, updated; filter by assignee (**Me** + teammates), status |

List is the fallback for narrow screens and power-user scanning.

---

## 4. Task card

Shared compact card on boards; list view uses a table row.

```
┌────────────────────────────────┐
│ ⠿  Task title            [↗] │
│    Due: Mar 12 · 2h ago      │
│                         ●    │  ← Telegram fail dot (bottom-right)
└────────────────────────────────┘
```

| State | Treatment |
|-------|-------------|
| Default | Compact white card, `--border`, `--radius-card` |
| Overdue | Red due date (`--danger`) |
| Telegram notify failed | Small accent dot, bottom-right corner |
| Operator board | Inline edit title/due; **+ Add task** in To do section; ↗ opens detail |

Operator cards show **assignee** only in list view (column implies assignee on board).

---

## 5. Task detail

Route: `/[locale]/tasks/[id]`

Same card width and field order as **New task** (`/tasks/new`), plus status and delete.

```
┌─────────────────────────────────────────────────────────┐
│  Edit task                              [← Back]        │
│  ─────────────────────────────────────────────────────  │
│  [Banner]: delivery failed (if applicable)              │
│  ─────────────────────────────────────────────────────  │
│  Title                                                  │
│  Assignee* (Operator only)                              │
│  Status (edit only)                                     │
│  Due date                                               │
│  Description                                            │
│  ─────────────────────────────────────────────────────  │
│  [Save]  [Cancel]                    [Delete task]      │
└─────────────────────────────────────────────────────────┘

* Create form: Title → Assignee → Due → Description (no status, no delete)
```

| Element | Operator | Teammate |
|---------|----------|----------|
| Back | Yes | Yes |
| Edit fields | Yes all fields | Yes own tasks (no assignee) |
| Delete | Yes any task | Yes own tasks only |
| Re-notify | Phase 1 API | — |

Shared components: `TaskFormFields`, `TaskFormActions`, `CreateTaskForm`, `EditTaskForm` — see [ARCHITECTURE.md](./ARCHITECTURE.md#task-forms).

---

## 6. Screen inventory

Routes below use **Operator** / **Teammate** to mean **role in the active group**, not a fixed account type.

| Screen | Route | Operator in group | Teammate in group |
|--------|-------|-------------------|-------------------|
| **Marketing landing** | `/` (locale home) | Public | Public |
| **Sign up** | `/signup` | Public | Public |
| **Log in** | `/login` | Public | Public |
| **No active group** | `/groups` | Yes (panel opens) | Yes (panel opens) |
| Tasks board | `/tasks` | Team board (§3.2) | Status Kanban (§3.1) |
| New task | `/tasks/new` | Yes | — |
| Task detail | `/tasks/[id]` | Yes | Own only |
| Teammates | `/teammates` | Yes | — |
| New teammate | `/teammates/new` | Yes | — |
| Teammate detail | `/teammates/[id]` | Yes | — |
| **Alerts** | `/alerts` | Yes | — |
| **Profile** | `/profile` | Yes | Yes |
| Settings | `/settings` | Yes | Yes |
| Join (group invite) | `/join/[token]` | Public | Public |
| Change password | `/change-password` | Yes | Yes |
| Privacy | `/privacy` | Public | Public |
| Terms | `/terms` | Public | Public |
| Audit | `/audit` | Yes (Phase 2) | — |

**Default URL:** `/[locale]` — public landing when logged out. **Sign up** / **Log in** from header or footer. After login: no group → `/groups`; operator in active group → `/teammates`; teammate in active group → `/tasks`.

**Profile** is reached from the avatar and sidebar footer — not in primary nav. **Settings** stays in sidebar / mobile tabs (group alert prefs only). **Group switcher** in header is the primary way to change active group.

---

## 7. Teammates (Operator)

### List `/teammates`

Table: name, email, role, account status, Telegram status, view link. Operators link to **Profile**; teammates to detail.

**Add teammate** — header button → `/teammates/new` (name, email); on save → detail page with invite + Telegram links (copy buttons).

**Export (Phase 2)** — toolbar **Export all** · per-row **Export** on the list. Spec: [REQUIREMENTS.md §6.5.2](./REQUIREMENTS.md#652-json-export-app).

### Detail `/teammates/[id]`

- Name, email, account + Telegram badges
- Edit name (+ email before first login), **promote to operator** (active account), deactivate
- **Invite link** — `/join/{token}` · copy · regenerate
- **Telegram link** — `t.me/...?start=code` · copy · regenerate

---

## 8. Profile & Settings

Two distinct pages — **Profile** is who you are; **Settings** is how the app behaves. No cross-links between them; use the account menu or sidebar to switch.

### 8.1 Profile (`/profile`)

All users. Access: avatar (header / mobile), sidebar footer, account menu.

| Section | Content | Phase 1 |
|---------|---------|---------|
| **Photo** | Upload / change / remove profile photo | Mock: browser storage · production: server upload |
| **Account** | Editable display name; email read-only | Yes |
| **Language** | Locale picker; persisted on account | Yes |
| **Password** | Change password form | Yes |
| **Telegram** | Link status; operators generate alert link + copy | Yes |
| **Log out** | Button (mobile primary exit; desktop also in account menu) | Yes |

Group and role live in the **group switcher** only — not on Profile.

### 8.2 Settings (`/settings`)

All users with an active group. Access: sidebar / mobile tabs only (not account menu).

| Section | Content | Phase 1 |
|---------|---------|---------|
| **Operator alerts** | Toggles + link to Alerts history; Telegram banner if unlinked | Yes |
| **Notifications** | Teammate empty state (operators configure alerts) | Yes |
| **Membership** | Leave group; delete group (operator) | Yes |

Language and group switching live on **Profile** and the header **Group switcher**, not here.

**Profile** has no role — account only. **Settings** is group-scoped alerts + leave/delete group. Group and role appear in the **group switcher** only.

### 8.3 Alerts (`/alerts`)

Operator only. Access: sidebar / mobile tabs.

| Content | Phase 1 |
|---------|---------|
| Feed of teammate **task done** and **due/overdue** events | Yes mock |
| Delivery badge: Telegram vs web-only (depends on Operator Telegram link) | Yes mock |
| Preferences | **Settings** → Operator alerts toggles |

Teammates do not have this route (redirect to `/tasks`).

Operator-only system settings (audit, org config) remain Phase 2+.

---

## 9. Empty & error states

| Context | Message (EN example) | CTA |
|---------|----------------------|-----|
| No groups | “You are not in any group yet.” | Create group |
| No tasks (Teammate) | “No tasks assigned to you yet.” | — |
| No teammates (Operator board) | “Add teammates to start relaying work.” | Add teammate |
| No alerts (Operator) | “No alerts yet…” | — |
| Empty todo column | Light placeholder in column | — |
| Login failed | “Invalid email or password.” | — |
| Session expired | Redirect to login + toast | Log in again |
| Telegram delivery failed | Banner on task detail | — |

---

## 10. Telegram UX (companion to web)

Not a web screen — copy and structure for bot messages.

### Task notification

```
📋 Task title

Description (truncated…)

Due: 2026-03-15

Reply to this message with an update.
Say "done" / "feito" when finished.
```

### Welcome (`/start` linked)

```
Welcome to SirRelay, {name}!
You'll receive tasks here one at a time.
Reply to each message to update your progress.
```

### Queue empty (P1-TG-08)

```
All caught up — no more tasks. 🎉
```

Localized per user `locale` (`en-gb`, `es-es`, `pt-br`; DB `en` / `es` / `pt`).

---

## 11. Components (implementation)

| Component | Notes |
|-----------|-------|
| `GroupSwitcher` + `GroupPanelMenu` | Header panel — switch · create · join |
| `GroupDangerSettings` | Settings page — leave / delete active group |
| `PromoteTeammateButton` | Teammate detail — promote to operator (confirm) |
| `DeactivateTeammateButton` | Teammate detail — deactivate |
| `AppShell` | Sidebar + collapse + role-based nav (when group active) + profile footer |
| `AppHeader` | Desktop group switcher + locale picker + account menu |
| `MobileTopBar` | Compact logo, group switcher, locale, avatar, tab nav |
| `LocaleSwitcher` | Same-path locale change via URL prefix |
| `UserMenu` | Account dropdown (Profile, Settings, Log out) |
| `UserAvatar` / `ProfileAvatarEditor` | Initial or uploaded photo |
| `TaskFormFields` / `CreateTaskForm` / `EditTaskForm` | Shared create + edit forms (§5) |
| `OperatorBoardTaskCard` | Operator board: inline edit, open detail, drag handle |
| `DraggableTaskCard` | Teammate Kanban card |
| `BoardQuickAddTask` | Per-column quick add in To do section |
| `TeammateBoard` | Operator team board (§3.2) — includes **Me** column |
| `OperatorAlertsList` | Operator alert feed (§8.3) |
| `StatusKanban` | Teammate 3-column board (§3.1) |
| `TaskList` | Table list view |
| `ViewToggle` | Board / List switch |
| `StatusBadge` | Maps `todo` / `doing` / `done` to UI labels (§ Status naming) |
| `ToneBadge` | Role, account, Telegram, alert delivery chips |
| `Banner` | Warning (delivery error on task detail) |
| `SyncBar` | Session sync status (mock) |

**Styling:** Tailwind + CSS variables from `brand/brand.css`. Card radius 8px, button 6px per [BRAND.md](./BRAND.md).

---

## 12. Responsive summary

| Breakpoint | Shell | Operator tasks | Teammate tasks |
|------------|-------|----------------|----------------|
| ≥768px | Sidebar + top header utilities | Team board (horizontal scroll) | Status Kanban (3 columns) |
| <768px | Top bar + tab nav (no sidebar) | Board or list (toggle) | Kanban stacks vertically |

Toolbar offers Board / List toggle when both are implemented for that role.

---

## 13. Phase mapping

| UX item | Phase | Mock status |
|---------|-------|-------------|
| Marketing landing | 1 | Yes mock |
| Team board + inline edit + quick add | 1 | Yes mock |
| Task create + edit + delete forms | 1 | Yes mock |
| Status Kanban + list toggle | 1 | Yes mock |
| Profile vs Settings split | 1 | Yes mock |
| Join + change-password + privacy | 1 | Yes mock |
| Operator alerts + **Alerts** page | 1 | Yes mock |
| Sidebar collapse + logo cross-fade | 3 (P3-11) | Yes in mock |
| Drag-and-drop on Kanban | 3 (P3-03) | Yes in mock |
| Locale persist via API | 1 | mock cookie only |
| Audit screen | 2 | — |
| Native mobile apps | 3 (P3-13) | — |

---

## Revision history

| Date | Change |
|------|--------|
| 2026-06-27 | Operator teammate-columns board; Teammate status Kanban |
| 2026-06-27 | Status labels: UI “In progress” ↔ code `doing` |
| 2026-06-28 | Profile page (photo, account, Telegram); Settings = app prefs only |
| 2026-06-28 | App shell: collapsible sidebar, mobile tab nav, header locale + avatar menu |
| 2026-06-28 | Teammates: `/teammates/new` create flow (mock) |
| 2026-06-28 | Legacy cleanup: removed stub routes, mock banner, non-functional task/teammate actions; Alerts page |
| 2026-07-12 | Profile/Settings UX: editable name, copy Telegram link, settings subtitle, alerts link, join locale |
| 2026-07-12 | Removed export from teammate detail; legacy routes removed |
| 2026-07-11 | User → group → role model (§1.1); groups hub UX (§2.1); AuthPageHeader; membership-scoped nav and Profile badge |
| 2026-07-11 | Marketing landing (§2.0); hosted product entry at `/[locale]`; no-metric positioning |
| 2026-06-28 | Operator board: horizontal pan, inline edit, quick add, compact cards; drag hint removed |
| 2026-06-28 | Task detail: shared create/edit forms, delete task; removed web comments and archive |
