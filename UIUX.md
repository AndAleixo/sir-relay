# SirRelay — UI/UX

**Purpose:** Layout, interaction, and visual behavior for the web app and Telegram experience.  
**Companion docs:** [REQUIREMENTS.md](./REQUIREMENTS.md) (what must work) · [BRAND.md](./BRAND.md) (colors, logos, tokens)

**Last updated:** 2026-06-27

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
| **Role clarity** | Operator sees the **team**; Teammate sees **my work** |
| **To do + In progress first** | Active work is always visible; Done is secondary on the Operator board |
| **Calm UI** | Gray/white surfaces; yellow accent for CTAs and In progress column |
| **Small team scale** | 2–5 teammates; no enterprise density — readable cards, generous spacing |

---

## 2. App shell

Same layout for both roles; navigation and default view differ.

```
┌──────────────────────────────────────────────────────────────┐
│  [logo.svg]     Tasks                    [locale ▾] [user ▾] │
├────────────┬─────────────────────────────────────────────────┤
│            │  Page title                    [+ New task]*    │
│  Tasks     │  ─────────────────────────────────────────────  │
│  Teammates*│                                                 │
│  Settings  │              Main content                       │
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘

* Operator only          Teammate nav: Tasks · Settings
```

| Element | Spec |
|---------|------|
| Sidebar | Fixed left on ≥768px; drawer + hamburger on mobile |
| Header | `logo.svg` (expanded); `logo-compact.svg` when sidebar collapsed (Phase 3 animation) |
| Primary CTA | “New task” — Operator only, yellow button per [BRAND.md](./BRAND.md) |
| User menu | Name, role badge, settings link, logout |
| Locale | Dropdown in header + on login screen |

**Post-login landing:** Operator → team board · Teammate → my Kanban

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

- Click card → task detail
- Status change → dropdown on card (Phase 1); drag between columns (Phase 3)
- Setting status to `done` triggers relay (P1-TASK-12) same as Telegram

**Mobile (375px):** columns stack vertically: To do → In progress → Done.

---

### 3.2 Operator — teammate columns (team board)

One column per **active teammate**. Inside each column: **To do** and **In progress** expanded; **Done** collapsed.

```
┌─────────────────┬─────────────────┬─────────────────┐
│    Ana          │    Bruno        │    Carla        │
│  ● linked       │  ○ pending TG   │  ● linked       │
├─────────────────┼─────────────────┼─────────────────┤
│ TO DO (2)       │ TO DO (1)       │ TO DO (0)       │
│ ┌─────────────┐ │ ┌─────────────┐ │                 │
│ │ task card   │ │ │ task card   │ │  (empty)        │
│ └─────────────┘ │ └─────────────┘ │                 │
│                 │                 │                 │
│ IN PROGRESS (1) │ IN PROGRESS (0) │ IN PROGRESS (1) │
│ ┌─────────────┐ │                 │ ┌─────────────┐ │
│ │ task card   │ │                 │ │ task card   │ │
│ └─────────────┘ │                 │ └─────────────┘ │
│                 │                 │                 │
│ ▾ Done (5)      │ ▾ Done (2)      │ ▾ Done (8)      │
│  (collapsed)    │  (collapsed)    │  (collapsed)    │
└─────────────────┴─────────────────┴─────────────────┘
```

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

**Unassigned / deactivated teammates:**

- Deactivated teammates: hidden from board by default; toggle “Show inactive” in board toolbar
- Tasks with deactivated assignee: appear in optional “Unassigned / inactive” column or only in list view — Phase 1: show in **list view** filter only; board shows active teammates

**Horizontal scroll:** board scrolls horizontally when teammates > viewport; first column never clipped; scroll hint shadow on right edge.

**Mobile (375px):** one teammate column per screen width (horizontal snap scroll) **or** switch to **list view** default on mobile — **recommended:** list view on `<768px`, team board on desktop.

---

### 3.3 List view (both roles)

Toggle in toolbar: **Board** | **List** (icon + label).

| Role | List content |
|------|--------------|
| Teammate | My tasks; sort by due date, status, updated_at |
| Operator | All tasks; columns: title, assignee, status, due, updated; filter by teammate, status |

List is the fallback for narrow screens and power-user scanning.

---

## 4. Task card

Shared component across both boards and list view.

```
┌────────────────────────────────┐
│  Task title here               │
│  Due: Mar 12        ● overdue  │  ← red if overdue
│  Updated 2h ago                │
└────────────────────────────────┘
```

| State | Treatment |
|-------|-------------|
| Default | White card, `--border`, `--radius-card` |
| Overdue | Red due date (`--danger`) |
| Telegram pending | Small amber dot on Operator card if notify failed |
| Hover | Subtle border darken; pointer cursor |

Operator cards also show **assignee** only in list view (not on team board — column implies assignee).

---

## 5. Task detail

Route: `/[locale]/tasks/[id]`

```
┌─────────────────────────────────────────────────────────┐
│  ← Back          [Edit]*  [Notify again]*  [Archive]*   │
│  Task title                                             │
│  Assignee · Status ▾ · Due date                         │
│  ─────────────────────────────────────────────────────  │
│  Description (full)                                     │
│  ─────────────────────────────────────────────────────  │
│  ⚠ Banner: Telegram not linked / delivery failed        │
│  ─────────────────────────────────────────────────────  │
│  Comments                          [Add comment]        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Telegram] Ana · 2h ago                          │  │
│  │ feito — marked done                              │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Web] Operator · yesterday                       │  │
│  │ Please confirm when shipped.                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

* Operator only
```

| Element | Operator | Teammate |
|---------|----------|----------|
| Edit / Archive | ✓ | — |
| Notify again | ✓ | — |
| Status dropdown | ✓ | ✓ (own task) |
| Add comment | ✓ | ✓ (own task) |

---

## 6. Screen inventory

| Screen | Route | Operator | Teammate |
|--------|-------|----------|----------|
| Login | `/login` | ✓ | ✓ |
| Join (invite) | `/join/[token]` | — | ✓ |
| Change password | `/change-password` | ✓ (forced first login) | ✓ |
| Tasks board | `/tasks` | Team board (§3.2) | Status Kanban (§3.1) |
| New task | `/tasks/new` | ✓ | — |
| Edit task | `/tasks/[id]/edit` | ✓ | — |
| Task detail | `/tasks/[id]` | ✓ | Own only |
| Teammates | `/teammates` | ✓ | — |
| Teammate detail | `/teammates/[id]` | ✓ | — |
| Settings | `/settings` | ✓ | ✓ |
| Audit | `/audit` | ✓ (Phase 2) | — |

---

## 7. Teammates (Operator)

### List `/teammates`

Table or card list: name, email, account status, Telegram status, active toggle, actions (edit, invite, Telegram link).

### Detail `/teammates/[id]`

- Profile fields (name, email, locale)
- **Invite link** — copy button, expiry, regenerate
- **Telegram link** — copy `t.me/...?start=code`, regenerate
- Recent tasks assigned to this teammate (mini list, links to detail)

---

## 8. Settings

Both roles:

- Change password
- Locale selector
- (Teammate) Linked Telegram status + link instructions if `pending`

Operator only: no extra system settings in Phase 1.

---

## 9. Empty & error states

| Context | Message (EN example) | CTA |
|---------|----------------------|-----|
| No tasks (Teammate) | “No tasks assigned to you yet.” | — |
| No teammates (Operator board) | “Add teammates to start relaying work.” | Add teammate |
| Empty todo column | Light placeholder in column | — |
| Login failed | “Invalid email or password.” | — |
| Session expired | Redirect to login + toast | Log in again |
| Telegram delivery failed | Banner on task detail | Notify again |

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

Localized per teammate `locale` (`en`, `es`, `pt`).

---

## 11. Components (implementation)

| Component | Notes |
|-----------|-------|
| `AppShell` | Sidebar + header + role-based nav |
| `TaskCard` | Shared; props: task, showAssignee?, compact? |
| `TeammateBoard` | Operator team board (§3.2) |
| `StatusKanban` | Teammate 3-column board (§3.1) |
| `TaskList` | Sortable table/list |
| `StatusBadge` | Maps `todo` / `doing` / `done` to UI labels (§ Status naming) |
| `SourceBadge` | Web / Telegram on comments |
| `DoneAccordion` | Collapsed done section on Operator board |
| `Banner` | Warning (Telegram pending, delivery error) |

**Styling:** Tailwind + CSS variables from `brand/brand.css`. Card radius 8px, button 6px per BRAND.md.

---

## 12. Responsive summary

| Breakpoint | Operator tasks | Teammate tasks |
|------------|----------------|----------------|
| ≥768px | Team board (horizontal scroll) | Status Kanban (3 columns) |
| <768px | **List view** default | Kanban stacks vertically **or** list (prefer vertical Kanban if ≤3 tasks) |

Toolbar always offers Board / List toggle when both are implemented for that role.

---

## 13. Phase mapping

| UX item | Phase |
|---------|-------|
| Team board + Status Kanban + list toggle | 1 |
| Drag-and-drop on Kanban | 3 (P3-03) |
| Logo collapse animation | 3 (P3-13) |
| Audit screen | 2 |

---

## Revision history

| Date | Change |
|------|--------|
| 2026-06-27 | Operator teammate-columns board; Teammate status Kanban |
| 2026-06-27 | Status labels: UI “In progress” ↔ code `doing` |
