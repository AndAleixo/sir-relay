# SirRelay — UI/UX

**Purpose:** Layout, interaction, and visual behavior for the **public landing**, signed-in web app, and Telegram experience.  
**Companion docs:** [REQUIREMENTS.md](./REQUIREMENTS.md) (what must work) · [BRAND.md](./BRAND.md) (colors, logos, tokens) · [ARCHITECTURE.md](./ARCHITECTURE.md) (code layout)

**Last updated:** 2026-07-20

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
| **Account vs app config** | **Profile** = personal account (photo, account name, language, Telegram, password) · **Settings** = group details (incl. your fantasy name), alerts, membership (leave/delete) |
| **Web first** | Responsive web is the primary client; landing and app share brand tokens; native apps reuse API later |

### 1.1 Users, groups, and roles

```
User (account)
  ├── Group A — operator  →  nav: Tasks · Teammates · Events · Settings
  └── Group B — teammate →  nav: Tasks · Settings
```

| Concept | UX |
|---------|-----|
| **User** | Email + password; signs up at `/signup`; not labelled “operator” or “teammate” globally |
| **Group** | Team workspace; **create inline** in header group panel or join via invite (`/join/[token]` or panel paste) |
| **Role** | Per group; shown in **group switcher** only |
| **Active group** | Session selection; all app screens (tasks, teammates, events) are scoped here |
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
│  3 feature cards — simple · what matters now · one task at a time │
├──────────────────────────────────────────────────────────────┤
│  © Sir · SirRelay    FAQ · Privacy · Terms · Log in · Sign up │  ← footer
└──────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Header | Sticky; logo links home; locale links; **Sign up** (ghost) + **Log in** → `/[locale]/signup` · `/login` |
| Hero | Product hook: one clear task at a time; web + Telegram; primary CTA **Create account** → `/signup` |
| Demo | Browser frame with **`/brand/demo.webm`** (autoplay, muted, loop); CSS board fallback if video fails |
| Features | Three cards — simple to run · only what matters now · one task at a time (Telegram relay) |
| FAQ | `#faq` — groups, **metrics (anti-KPI home)**, Telegram, data/cache (public pages CDN-friendly; signed-in pages `no-store`) |
| Footer | Copyright, FAQ, Privacy, Terms, Log in, Sign up — shared `SiteFooter` on auth/legal pages |
| App store badges | **None** in Phase 1 (P3-13) |

**Voice:** Plain and product-first — lead with relay and clarity. Anti-metric positioning lives once in FAQ, not repeated in hero + features.

**Logged-in users:** `/[locale]` redirects to app home per [ARCHITECTURE.md](./ARCHITECTURE.md#entry-redirects).

---

## 2.1 Auth & group entry (pre-shell)

Pages outside the main app shell — centred card layout (`authShellStyles`), `SiteFooter`, optional **`AuthPageHeader`** (logo + “Back to home” → landing).

| Page | Route | Header | Purpose |
|------|-------|--------|---------|
| Sign up | `/signup` | Yes `AuthPageHeader` | New email → `/groups` (no group). Invited-email merge (P1-AUTH-13) **not shipped** — use `/join/<token>` to activate |
| Log in | `/login` | Yes `AuthPageHeader` | Existing account → role home or `/groups` |
| Join group | `/join/[token]` | Yes `AuthPageHeader` | Pre-created teammate: set password · existing **active** account → accept |
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
- **Join (pre-created, path A):** `/join/[token]` — set password → `active`
- **Join (pre-created, path B):** `/signup` same email — **not shipped** (P1-AUTH-13); today “Email taken” — use path A
- **Existing active account added by operator (same email):** pending request appears in the user’s switcher; Accept creates membership · Decline dismisses it
- **Request badge:** switcher trigger shows pending count; requests expire after 72h

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
│  Events*   │              Main content                         │
│  Settings  │                                                   │
│            │                                                   │
│ ────────── │                                                   │
│ Ana        │  ← footer links to Profile                        │
│      [◀]   │  ← collapse toggle (logo → logo-compact.svg)    │
└────────────┴──────────────────────────────────────────────────┘

* New task CTA for both roles · Teammate nav: Tasks · Settings
```

| Element | Spec |
|---------|------|
| Sidebar | Fixed left; collapsible (`w-56` ↔ `w-20`); preference stored in `localStorage` |
| Sidebar logo | `logo.svg` expanded · `logo-compact.svg` collapsed; cross-fade animation |
| Sidebar nav | Tasks · Teammates* · Events* · Settings — icons + labels (icons only when collapsed) |
| Sidebar footer | Profile link (name + avatar) only |
| Top header | **Group switcher** · locale picker · account menu (avatar + chevron) |
| Account menu (`▾`) | Name · Profile · Log out |
| Locale | Custom dropdown in header (same route, new locale prefix); also on login screen |
| Primary CTA | “New task” — both roles (yellow button per [BRAND.md](./BRAND.md)); teammate creates **self-assigned** only |

**Post-login landing:** no group → `/groups` · operator in active group → `/teammates` · teammate in active group → `/tasks` (Kanban)

### Mobile (<768px)

Sidebar hidden. Sticky top bar + tab navigation.

```
┌────────────────────────────────────────┐
│ [logo]  [Group ▾]     [EN▾] [avatar]   │
├────────────────────────────────────────┤
│   Tasks    Teammates*    Events*    Settings      │  ← icon tabs
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
│  + Add task │             │             │
└─────────────┴─────────────┴─────────────┘
```

| Column | Code | Header color | Label (en / es / pt) |
|--------|------|--------------|----------------------|
| To do | `todo` | `--status-todo` | To do / Por hacer / A fazer |
| In progress | `doing` | `--status-progress` | In progress / En progreso / Em progresso |
| Done | `done` | `--status-done` | Done / Hecho / Concluído |

**Card contents:** title (truncate 2 lines), due date (overdue in red). No “updated” time on board cards. Queue head (top To do): accent **→ Start** → In progress; In progress: neutral **✓** → Done; Done: green **✓** mark (not clickable).

**Interactions:**

- ↗ on card → task detail (edit form)
- **Quick add** at bottom of To do → creates a **self-assigned** task (same gate as `/tasks/new`)
- Drag between columns to change status (Phase 1)
- **Drag within To do** to set queue order; drop **inside** `[data-todo-scroll]` inserts by Y; drop on column chrome (header/footer) **appends**. Telegram follows the queue head when that person has no In progress task
- Start / complete controls on cards (same status changes as drag)
- Setting status to `done` triggers relay (P1-TASK-12) same as Telegram

**Mobile (375px):** columns stack vertically: To do → In progress → Done.

---

### 3.2 Operator — team board

First column: the **logged-in operator**. Then other members ordered by **To do count** (highest first; name as tiebreak). Inside each column: **To do** and **In progress** expanded; **Done** collapsed.

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│    Sam          │    Ana          │    Bruno        │    Carla        │
│  Operator       │  ● linked       │  ○ pending TG   │  ● linked       │
│  ● linked       │                 │                 │                 │
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

**Self column (first):** Operator self-assigned tasks; **Telegram task relay** when the operator’s account is linked (same one-at-a-time queue as teammates). Operators also receive **alert** notifications on Telegram. Label uses the same member naming rules (fantasy → account name → email) — **not** “Me / Eu / Yo”. **Drag within any member’s To do** (including self) reorders that queue; drop onto another member’s To do reassigns and places at that index (scroll list = by Y; section chrome = append).

#### Column header (member)

- Member label (fantasy name → account name → email)
- Status chips: role when operator; Telegram `linked` / `pending` when known; account `active` / `invited` for teammates
- Optional: count of `todo` + `doing` as summary badge

#### Sections inside each column (top → bottom)

| Section | Status | Priority | Default state | Max visible |
|---------|--------|----------|---------------|-------------|
| **To do** | `todo` | High — **top card** has start control (→ In progress); order = queue | Expanded | All cards |
| **In progress** | `doing` | High — each card has neutral ✓ → Done | Expanded | All cards |
| **Done** | `done` | Low — green ✓ mark (not clickable; flow complete) | **Collapsed** | Count in header; expand shows last **5** cards + muted “View all” label (not a navigation link) |

**Visual weight:**

- To do + In progress: full task cards, section labels in normal weight
- Done: collapsed accordion; muted label (`--text-muted`); yellow **not** used in Done section

**Removed teammates:** membership and tasks assigned to them in that group are permanently deleted after explicit confirmation; their global account remains.

**Horizontal scroll:** drag left/right on the board; native scrollbar at bottom when columns overflow.

**Mobile (375px):** horizontal snap scroll between columns, or switch to list view.

---

### 3.3 List view (both roles)

Toggle in toolbar: **Board** | **List** (icon + label).

| Role | List content |
|------|--------------|
| Teammate | My tasks; sort by due date, status, updated_at |
| Operator | All tasks; columns: title, assignee, status, due, updated; filter by assignee (self + all other members), status |

List is the fallback for narrow screens and power-user scanning.

---

## 4. Task card

Shared compact card on boards; list view uses a table row.

```
┌────────────────────────────────┐
│ ⠿  Task title            [↗] │
│    Due: Mar 12               │
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
│  Assignee* (Operator create/edit only)                  │
│  Status (edit only)                                     │
│  Due date                                               │
│  Description                                            │
│  ─────────────────────────────────────────────────────  │
│  [Save]  [Cancel]                    [Delete task]      │
└─────────────────────────────────────────────────────────┘

* Create form: Title → Assignee (operator) → Due → Description. Teammate create: no assignee field (always self).
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
| New task | `/tasks/new` | Yes | Yes (self only) |
| Task detail | `/tasks/[id]` | Yes | Own only |
| Teammates | `/teammates` | Yes | — |
| New teammate | `/teammates/new` | Yes | — |
| Teammate detail | `/teammates/[id]` | Yes | — |
| **Events** | `/events` | Yes | — |
| **Group activity** | `/events/activity` | Yes | — |
| **Platform admin** | `/platform/login`, `/platform`, … | Ops credentials only | — |
| **Profile** | `/profile` | Yes | Yes |
| Settings | `/settings` | Yes | Yes |
| Join (group invite) | `/join/[token]` | Public | Public |
| Change password | `/change-password` | Yes | Yes |
| Privacy | `/privacy` | Public | Public |
| Terms | `/terms` | Public | Public |

**Default URL:** `/[locale]` — public landing when logged out. **Sign up** / **Log in** from header or footer. After login: no group → `/groups`; operator in active group → `/teammates`; teammate in active group → `/tasks`.

**Profile** is reached from the avatar and sidebar footer — not in primary nav. **Settings** stays in sidebar / mobile tabs (group alert prefs only). **Group switcher** in header is the primary way to change active group.

---

## 7. Teammates (Operator)

### List `/teammates`

Table: name, email, role, account status, Telegram status, view link. **You** → **Settings**; **any other member** (teammate or operator) → `/teammates/[id]`.

**Add teammate** — header button → `/teammates/new` (**email only**). New/invited account → teammate detail with activation link; list shows **email + Pending** until the person sets their account name. Existing active account → pending request, no membership until acceptance (opaque success; do not surface account name on lookup).

**Pending requests** — operator list shows pending/declined/expired requests and **Resend**. Existing members remain in the main table only.

**Export (Phase 2)** — toolbar **Export all** · per-row **Export** on the list. Spec: [REQUIREMENTS.md §6.5.2](./REQUIREMENTS.md#652-json-export-app).

### Detail `/teammates/[id]`

- Group label (`display_name ?? name`), email, role, account + Telegram **status** badges
- Edit **group fantasy name** (`display_name`); email only while `invited`; **promote to operator** (active teammate only), remove from group (not yourself)
- **Never** edit another user’s global account name — that lives on **Profile**
- Works for both teammates and other operators in the active group
- **Invite link** — `/join/{token}` · copy · regenerate (invited teammates only)
- Teammate links Telegram on **Profile** after activation (operator has no Telegram link field here)

Member may also edit their own fantasy name for the active group on **Settings** (same field operators edit on member detail).

---

## 8. Profile & Settings

Two distinct pages — **Profile** is who you are across SirRelay; **Settings** is the **active group**.

**Telegram is account-scoped on Profile** (one bot link per user). **Any linked member** gets **task relay** when assigned work. Operators **also** receive **alert** notifications (teammate done / due). Settings may deep-link to Profile when Telegram is unlinked — that is the intended cross-link; otherwise navigate via account menu or sidebar.

### 8.1 Profile (`/profile`)

All users. Access: avatar (header / mobile), sidebar footer, account menu.

| Section | Content | Phase 1 |
|---------|---------|---------|
| **Photo** | Upload / change / remove profile photo | Mock: browser storage · production: server upload |
| **Account** | Editable **own** account name; email read-only. **No** group fantasy name here | Yes |
| **Language** | Locale picker; persisted on account | Yes |
| **Password** | Change password form | Yes |
| **Telegram** | Account-scoped. **Task relay** for assigned work (all roles). Operators **also** get **alerts**. Linked: **Unlink Telegram**. Pending: copy · **Open in Telegram** · **New link code** | Yes |
| **Log out** | Button (mobile primary exit; desktop also in account menu) | Yes |

Group and role live in the **group switcher** only — not on Profile. Fantasy / group display name lives on **Settings**.

### 8.2 Settings (`/settings`)

All users with an active group. Access: sidebar / mobile tabs only (not account menu).

| Section | Content | Phase 1 |
|---------|---------|---------|
| **General** | Group name (operator rename); **your fantasy name** for this group only | Yes |
| **Operator alerts** | Toggles + link to **Events**; banner → **Profile** if Telegram unlinked | Yes |
| **Notifications** | Teammate empty state (operators configure alerts); banner → **Profile** if unlinked | Yes |
| **Membership** | Leave group; delete group (operator) | Yes |

Language and Telegram live on **Profile**; group switching on the header **Group switcher**.

**Profile** = account (incl. Telegram). **Settings** = group-scoped (fantasy name, which alerts to send, leave/delete). Group and role appear in the **group switcher** only.

### 8.3 Events (`/events`)

Operator only. Access: sidebar / mobile tabs.

| Content | Phase |
|---------|-------|
| Feed of teammate **task done** and **due/overdue** alerts | Shipped |
| Delivery badge: Telegram vs web-only (operator alert prefs + linked Telegram) | Shipped |
| Link to **Group activity** (`/events/activity`) — human-language history of group changes (no login/logout) | Shipped |
| Preferences | **Settings** → Operator alerts toggles | Shipped |

Teammates do not have this route (redirect to `/tasks`).

**Implementation notes:** `lib/activity` + `domain/activity` (group history). Store: `audit_logs` via `lib/audit`. Platform ops console: `/platform/login` with env `PLATFORM_ADMIN_*` + cookie `sirrelay_platform_session` (not product credentials).

---

## 9. Empty & error states

| Context | Message (EN example) | CTA |
|---------|----------------------|-----|
| No groups | “You are not in any group yet.” | Create group |
| No tasks (Teammate) | “No tasks assigned to you yet.” | — |
| No members (Operator board) | “Add members to start coordinating work.” | Add teammate |
| No events / alerts (Operator) | “No alerts yet…” | — |
| Empty todo column | Light placeholder in column | — |
| Login failed | “Invalid email or password.” | — |
| Session expired | Redirect to login + toast | Log in again |
| Telegram delivery failed | Banner on task detail | — |

---

## 10. Telegram UX (companion to web)

Not a web screen — copy and structure for bot messages.

### Task notification

```
Task title
Group: Demo Shop

Description (truncated…)

Due: 2026-03-15
Open: https://app.example.com/en-gb/tasks/{id}

Reply to THIS message with: done · in progress (or hecho / feito / working).
```

If the user writes without replying to the task message (or replies to the wrong one), the bot answers with a short hint to use Reply on the task notification.

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
| `RemoveTeammateButton` | Teammate detail — confirm permanent deletion of assigned group tasks, then remove membership; account remains |
| `AppShell` | Sidebar + collapse + role-based nav (when group active) + profile footer |
| `AppHeader` | Desktop group switcher + locale picker + account menu |
| `MobileTopBar` | Compact logo, group switcher, locale, avatar, tab nav |
| `LocaleSwitcher` | Same-path locale change via URL prefix |
| `UserMenu` | Account dropdown (Profile, Log out) |
| `UserAvatar` / `ProfileAvatarEditor` | Initial or uploaded photo |
| `TaskFormFields` / `CreateTaskForm` / `EditTaskForm` | Shared create + edit forms (§5) |
| `OperatorBoardTaskCard` | Operator board: inline edit, open detail, drag handle |
| `DraggableTaskCard` | Teammate Kanban card |
| `BoardQuickAddTask` | Quick add in To do (`components/tasks/board-quick-add-task`) — operator columns + teammate Kanban |
| `TeammateBoard` | Operator team board (§3.2) — self first, then members by To do load |
| `OperatorAlertsList` | Operator alerts list on `/events` (§8.3) |
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

| UX item | Phase | Status |
|---------|-------|--------|
| Marketing landing | 1 | Shipped (mock + API) |
| Team board + inline edit + quick add | 1 | Shipped |
| Task create + edit + delete forms | 1 | Shipped |
| Status Kanban + list toggle | 1 | Shipped |
| Profile vs Settings split | 1 | Shipped |
| Join + change-password + privacy | 1 | Shipped |
| Operator alerts + **Events** page | 1 | Shipped |
| To do queue DnD + status/reassign drops | 1 | Shipped |
| Sidebar collapse + logo cross-fade | 3 (P3-11) | Yes in UI |
| Kanban DnD polish (touch / a11y) | 3 (P3-03) | Core shipped in Phase 1 |
| Locale persist (Profile) | 1 | Shipped via `updateLocale`; header switcher changes URL path only |
| Group activity (`/events/activity`) | 2 | Shipped |
| Platform admin (`/platform/*`) | 2 | Shipped (separate ops login) |
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
| 2026-07-12 | Profile/Settings UX: editable name, Telegram link (copy · open · new code), settings subtitle, alerts link, join locale |
| 2026-07-12 | Removed export from teammate detail; legacy routes removed |
| 2026-07-11 | User → group → role model (§1.1); groups hub UX (§2.1); AuthPageHeader; membership-scoped nav and Profile badge |
| 2026-07-11 | Marketing landing (§2.0); hosted product entry at `/[locale]`; no-metric positioning |
| 2026-07-14 | Pre-create + invite activation (§2.1); teammate Telegram on Profile only (§7, §8.1); sign-up merge noted as intended |
| 2026-07-18 | Fantasy name only on Settings / member detail (not Profile); operator board columns = all other members |
| 2026-07-18 | Landing copy: product-first hero (one task at a time); anti-metrics only in FAQ |
| 2026-07-18 | Telegram locked to Profile (account); Settings deep-links when unlinked; linked members (incl. operators) get task relay; operators also get alerts |
| 2026-07-18 | To do priority = visual order; drag place/reorder in member To do (operator board / teammate Kanban); Telegram follows queue head |
| 2026-07-18 | Operator self column uses same header as members (name, not “Me”) |
| 2026-07-18 | Board cards: queue start / complete controls; Done shows completed mark; no “updated” on cards |
| 2026-07-20 | Teammate Kanban: quick add in To do (self-assigned) |
| 2026-07-20 | Teammate can create self-assigned tasks (`/tasks/new` + New task CTA) |
| 2026-07-19 | Phase 1 sync: live DnD (not P3-only); drop scroll vs append; View all not a link; UserMenu = Profile · Log out; column order by To do load |
| 2026-06-28 | Operator board: horizontal pan, inline edit, quick add, compact cards; drag hint removed |
| 2026-06-28 | Task detail: shared create/edit forms, delete task; removed web comments and archive |
