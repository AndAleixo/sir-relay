# SirRelay — UI/UX

**Purpose:** Layout, interaction, and visual behavior for the public landing, signed-in web app, and Telegram copy.  
**Doc contract:** **How it looks and behaves on screen.** Product rules, acceptance IDs, and permissions → [REQUIREMENTS.md](./REQUIREMENTS.md). Visual tokens → [BRAND.md](./BRAND.md). Code map → [ARCHITECTURE.md](./ARCHITECTURE.md). Link to requirements for business rules; do not restate them here.

**Last updated:** 2026-09-20

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
| **Group context** | Role is always **in the active group** — same person may operate one team and work as teammate in another |
| **To do + In progress first** | Active work is always visible; Done is secondary on the Team board |
| **Calm UI** | Gray/white surfaces; yellow accent for CTAs and In progress column |
| **No metric pressure** | Tasks and due dates only — no velocity / leaderboards |
| **Small team scale** | 2–5 people; readable cards, generous spacing |
| **Account vs app config** | **Profile** = personal account · **Settings** = active group |
| **Web first** | Responsive web primary; landing and app share brand tokens |

### 1.1 Users, groups, and roles

```
User (account)
  ├── Group A — operator
  └── Group B — teammate
         └── same nav: Tasks · Teammates · Projects · Events · Settings
```

| Concept | UX |
|---------|-----|
| **User** | Email + password; not labelled operator/teammate globally |
| **Group** | Create/join in header **group panel**; leave/delete on **Settings** |
| **Role** | Per group; shown in group switcher only |
| **Active group** | Scopes tasks, teammates, events |
| **Switch** | Header group switcher panel |

**Post-login destinations** and join/ownership rules: [REQUIREMENTS §5.1](./REQUIREMENTS.md#51-authentication) · [§5.1.1](./REQUIREMENTS.md#511-groups).

---

## 2.0 Marketing landing

Public page at `/[locale]` for logged-out visitors. Implemented in `src/components/landing/`. Acceptance: [P1-UI-03–07](./REQUIREMENTS.md#55-ui--i18n).

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
| Header | Sticky; logo → home; locale links; **Sign up** (ghost) + **Log in** |
| Hero | One clear task at a time; web + Telegram; CTA **Create account** → `/signup` |
| Demo | `/brand/demo.webm` (autoplay, muted, loop); CSS board fallback |
| Features | Three cards — simple · what matters now · one task at a time |
| FAQ | `#faq` — groups, anti-KPI, Telegram, data/cache |
| Footer | Shared `SiteFooter` on auth/legal pages |
| App store badges | None in Phase 1 |

**Voice:** Product-first; anti-metric positioning once in FAQ (not hero + features).

**Logged-in:** `/[locale]` redirects per [ARCHITECTURE.md](./ARCHITECTURE.md#entry-redirects).

---

## 2.1 Auth & group entry (pre-shell)

Centred card layout (`authShellStyles`), `SiteFooter`, optional **`AuthPageHeader`** (logo + back to landing).

| Page | Route | Header | Purpose |
|------|-------|--------|---------|
| Sign up | `/signup` | Yes | New email → check-email / verify. Invited email → activates (P1-AUTH-13), verified |
| Log in | `/login` | Yes | → role home or `/groups`; link forgot password; unverified → resend |
| Forgot / reset | `/forgot-password`, `/reset-password` | Yes | Generic success; set new password via token |
| Verify / check email | `/verify-email`, `/check-email` | Yes | Token consume · “check your inbox” |
| Contact | `/contact` | Yes | Form → `CONTACT_EMAIL` (honeypot + rate limit) |
| Join group | `/join/[token]` | Yes | Set password / accept invite |
| Privacy / Terms | `/privacy`, `/terms` | Yes | Canonical English pack `legal/en.json` · `CONTACT_EMAIL` |
| No active group | `/groups` | App shell | Placeholder; **group panel opens** |

**Group panel** (header): switch · create · join. Leave/delete → **Settings**. Rules: [REQUIREMENTS §5.1.1–5.1.2](./REQUIREMENTS.md#511-groups).

```
┌─ Group panel (header switcher) ─────┐
│  Demo Shop              * Operator  │
│  Side Project              Teammate │
├─────────────────────────────────────┤
│  Create group          (expand)     │
│  Join with invite      (expand)     │
└─────────────────────────────────────┘
```

- Empty: expand create **or** join
- Single group, no active: `/groups/auto` → role home
- 2+ groups, no active: `/groups` + panel open
- Invite errors inline (no reload); mobile panel = dropdown under trigger (not bottom sheet)
- Pending requests: badge on switcher; Accept / Decline in panel

---

## 2.2 App shell

Same chrome; **nav depends on role in the active group**. Destinations: [P1-AUTH-10](./REQUIREMENTS.md#51-authentication).

### Desktop (≥768px)

```
┌────────────┬──────────────────────────────────────────────────┐
│ logo.svg   │  [Group ▾]              [locale ▾] [avatar] [▾] │
│ ────────── │  Page title                    [+ New task]*      │
│  Tasks     │                                                   │
│  Teammates*│                                                   │
│  Projects  │              Main content                         │
│  Events*   │                                                   │
│  Settings  │                                                   │
│            │                                                   │
│ ────────── │                                                   │
│ Ana        │  ← footer links to Profile                        │
│      [◀]   │  ← collapse toggle (logo → logo-compact.svg)    │
└────────────┴──────────────────────────────────────────────────┘

* New task for both roles · Teammates / Events: teammate is read-only
```

| Element | Spec |
|---------|------|
| Sidebar | Collapsible (`w-56` ↔ `w-20`); preference in `localStorage` |
| Sidebar logo | `logo.svg` (**SRelay**) / `logo-compact.svg` (**SR**); cross-fade |
| Sidebar nav | Tasks · Teammates · Projects · Events · Settings |
| Sidebar footer | Profile (name + avatar) |
| Top header | Group switcher · locale · account menu |
| Account menu | Name · Profile · Log out |
| Locale | Header dropdown (URL prefix); also on login |
| Primary CTA | **New task** (yellow); teammate = self-assigned only |

### Mobile (<768px)

```
┌────────────────────────────────────────┐
│ [logo]  [Group ▾]     [EN▾] [avatar]   │
├────────────────────────────────────────┤
│   Tasks  Teammates  Projects  Events  Settings  │  ← icon tabs
├────────────────────────────────────────┤
│              Main content              │
└────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Top bar | Compact logo, group switcher, locale, avatar → Profile |
| Tab nav | Same items as sidebar |
| Log out | Profile page (+ desktop account menu) |

---

## 3. Task boards — scope + layout

Both roles: `/[locale]/tasks`. Toolbar: **My work | Team** · **Board | List** · New task. Capabilities: [P1-VIEW-02/03](./REQUIREMENTS.md#55-ui--i18n) · [P1-TASK-04](./REQUIREMENTS.md#53-tasks--relay-queue). Manage projects on the **Projects** tab. List view: project filter with the other list filters (not on the board); inline edit title, project, and category.

**URL state:** `?scope=mine|team&view=board|list` (defaults: teammate → mine, operator → team; view → board). Preserve through detail/new and save/delete/create. Success flash (`saved`, `deleted`, …) is stripped after paint and shown as `Toast`; `error` stays as `Banner`. List-only project filter (P3-16): `?project=<id>` or omit = All — [REQUIREMENTS §7.2](./REQUIREMENTS.md#72-group-projects-p3-16). The board ignores `project` and always shows every task in the current scope.

| Scope | Default | Board | List |
|-------|---------|-------|------|
| **My work** | Teammate | Status Kanban (own) | Own tasks |
| **Team** | Operator | Member columns (`TeamBoard`) | All group tasks + assignee filter |

**Editability:** operator = all columns; teammate Team = **own column only** (others: no ⠿ / inline / quick-add / drop; detail read-only).

### 3.1 My work — status Kanban

Three columns by status. Empty My work → §9 copy (not empty columns). Card anatomy: §4.

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

**Done (My work + Team accordion):** last **5** cards; **Show more** +**10**. No inner scroll pane. Count = total Done.

**Interactions:**

- Card body: no text select / default cursor; move only via ⠿
- Title / due → inline edit when editable
- **Quick add** (To do) → self-assigned
- Drag between columns → status; **within To do** → queue order (scroll list = Y insert; chrome = append). Telegram follows queue head — [P1-TASK-11/12](./REQUIREMENTS.md#53-tasks--relay-queue)
- Start / complete controls on title row; `done` triggers relay

**Mobile:** columns stack vertically.

---

### 3.2 Team — member columns

First column: **signed-in member**. Others by **To do count** at page load (fixed while editing). Inside: To do + In progress expanded; Done collapsed.

**Operator:** edit all; member names → `/teammates/[id]`. **Teammate:** own column editable; others view-only (**⋯ → Open**); names → `/teammates/[id]` (read-only).

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Sam  ● linked  │  Ana  ● linked  │ Bruno ○ pending │  Carla ● linked │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ TO DO …         │ TO DO …         │ TO DO …         │ TO DO …         │
│ IN PROGRESS …   │ IN PROGRESS …   │ IN PROGRESS …   │ IN PROGRESS …   │
│ ▾ Done …        │ ▾ Done …        │ ▾ Done …        │ ▾ Done …        │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Self column:** same naming (fantasy → account → email) — not “Me”. Drop onto another editable To do reassigns (Y / chrome rules as My work).

#### Column header

Member label left · inactive + Telegram icons right. No role chip; no active-task count.

#### Sections (top → bottom)

| Section | Status | Default | Visible |
|---------|--------|---------|---------|
| **To do** | `todo` | Expanded | Scroll after ~3 mobile / ~4 desktop; top card → start |
| **In progress** | `doing` | Expanded | Same scroll; ✓ → Done |
| **Done** | `done` | Collapsed | Preview 5 + Show more +10; green ✓ mark |

**Weight:** To do / In progress full; Done muted accordion (no yellow).

**Pan:** horizontal drag on empty chrome only; cards move via ⠿. **Mobile:** snap columns or list view.

---

### 3.3 List view (both roles)

| Scope | Content |
|-------|---------|
| My work | Own tasks; sort due / status / updated |
| Team | All group tasks; assignee + status filters |

Columns: **Title**, **Project**, **Category**, assignee, status, due. Same fields on all widths: desktop is a 6-column grid; below 768px stacks title then a wrapping meta row (no wide table scroll). Click title → 2-line input (200 chars). Click project / category / assignee / status → vertical Family A picker. Assignee retag is operator-only. Click due → date field. Filters: 2-column Select grid on mobile (labels visually hidden, `aria-label` kept); labeled row from `md`. Category is inert until a project is set. Overdue uses `--severity` like the card, without the word Overdue. Board cards stay `SIR · title` with no category.

Fallback for narrow screens and scanning.

---

## 4. Task card

Shared compact card on boards; list uses a table row. Clone rule: [P1-TASK-14](./REQUIREMENTS.md#53-tasks--relay-queue).

```
┌────────────────────────────────┐
│ ⠿  SHP · Task title       → │
│    Description… (if due set) │
│    Due / description     ⋯   │  ← description in due slot when no date
│                         ●    │
└────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| **⠿** drag | Cursor grab; optional soft tint when difficulty is set — colours in [BRAND.md §2.2.1](./BRAND.md#221-task-difficulty-board--handle) (hard = overdue `--severity`) |
| Title | Acronym + ` · ` inline on the first line; wrapped title continues underneath. Click title → inline edit. |
| Acronym | Click → sideways segment like **⋯** (fade/slide; title fades to ~10%). Fills to the title end when items overflow; arrow overlays stay put (hide at ends). |
| Description | One muted truncated line: under title when due set (`pr-2`); else in footer due slot |
| Due | Overdue in `--severity`; empty + no description → **Add due date** (editable) |
| Status controls | Queue head **→** (start); In progress **✓** → Done; Done green ✓ mark |
| **⋯** menu | Segment left of trigger (card `bg-surface-card`); **Open · Clone · Delete** (Open only if read-only). Footer due/description fades to ~10% while open. Same fade timings as Family A |
| Notify failed | Accent corner dot (`telegramFailed` tooltip) |
| Quick add | `+ Add task` in editable To do |

Assignee only in list view (Team board column implies assignee).

---

## 5. Task detail

Route: `/[locale]/tasks/[id]`. Same field order as **New task**; plus status and delete. Forms: [ARCHITECTURE.md](./ARCHITECTURE.md#task-forms).

```
┌─────────────────────────────────────────────────────────┐
│  Edit task                              [← Back]        │
│  [Banner]: delivery failed (if applicable)              │
│  Title · Assignee* · Status · Difficulty · Due · Description         │
│  [Save]  [Cancel]                    [Delete task]      │
└─────────────────────────────────────────────────────────┘

* Operator only on create/edit. Teammate create: always self.
```

| Element | Operator | Teammate |
|---------|----------|----------|
| Edit / delete | Any task | Own only |
| Re-notify | Phase 1 API | — |

---

## 6. Screen inventory

**Access matrix:** [REQUIREMENTS §5.10](./REQUIREMENTS.md#510-routes). Below = UX route checklist (role = **in active group**).

| Screen | Route | Operator | Teammate |
|--------|-------|----------|----------|
| Landing | `/` | Public | Public |
| Sign up / Log in | `/signup`, `/login` | Public | Public |
| Forgot / reset / verify / check-email | `/forgot-password`, `/reset-password`, `/verify-email`, `/check-email` | Public | Public |
| Contact | `/contact` | Public | Public |
| No active group | `/groups` | Panel opens | Panel opens |
| Tasks / new / detail | `/tasks…` | Full | Own edit · Team view others |
| Teammates | `/teammates…` | Yes | Read list/detail; no add / export / invite / promote |
| Projects | `/projects` | Yes | Yes (request project; categories: add / archive) |
| Events / activity | `/events…` | Yes | Alerts read-only; no group activity |
| Profile / Settings | `/profile`, `/settings` | Yes | Yes |
| Join / change-password | `/join/[token]`, `/change-password` | Auth flows | Auth flows |
| Privacy / Terms | `/privacy`, `/terms` | Public | Public (English pack) |
| Accept terms | `/accept-terms` | Signed-in | When `needsLegalAccept` |
| Platform admin | `/platform/*` | Ops credentials | — |

Profile via avatar / sidebar footer (not primary nav). Group switcher = change active group.

---

## 7. Teammates

Rules: [REQUIREMENTS §5.2](./REQUIREMENTS.md#52-teammates).

### List `/teammates`

Table: **Name** · **Email** · **Role** · **Account** · **Telegram**. Name → **You** = Settings; else `/teammates/[id]`.

**Operator:** **Add** → `/teammates/new` (email only). Pending invitations: Resend. **Export** → CSV. **Teammate:** same table and pending list; no Add / Export / Resend.

### Detail `/teammates/[id]`

Read: email, account name, fantasy name, role, status icons.

**Operator only:** fantasy name form · email (while invited) · promote / demote / transfer ownership / remove · invite link · export.

---

## 8. Profile & Settings

**Profile** = account across SirRelay. **Settings** = **active group**. Telegram link on Profile only (relay for assignees; operators also get alerts).

**Help copy:** title or label → muted `text-xs` hint → control. Do not place field hints below the control (same pattern as CardHeader section hints).

### 8.1 Profile (`/profile`)

| Section | Content |
|---------|---------|
| Photo | Click avatar to upload / change / remove; crop square; ≤1 MB on device |
| Account | Own name; email read-only |
| Language | Locale picker (persisted) |
| Password | Change form |
| Telegram | Link / unlink / new code · Open in Telegram |
| Log out | Button |

### 8.2 Settings (`/settings`)

| Section | Content |
|---------|---------|
| General | Group name (operator); role (+ owner line); your fantasy name |
| Notifications | Operator: alert toggles + Events link; teammate: hint + Events link; banner → Profile if unlinked |
| Leave / delete | Leave · delete (owner) — [P1-GRP-09/10](./REQUIREMENTS.md#511-groups) |

### 8.2.1 Group projects (`/projects`)

Primary nav tab (between Teammates and Events). Toolbar: hint + create/request (name, acronym). **Pending** requests sit in a dashed band (operator: Accept + trash). **Accepted** projects are a card grid: heading `SIR · Name` (same pattern as the task card), category chips + add on the card (**both roles**). Caps: [P3-PRJ-11](./REQUIREMENTS.md#72-group-projects-p3-16)–[P3-PRJ-13](./REQUIREMENTS.md#72-group-projects-p3-16). Category does not appear on the task card.

### 8.3 Events (`/events`)

Both roles. Teammate done / due alerts; delivery badge; **Show more** after the first 8 (same pattern as Done on the board). **Group activity** link: operator only. Alert prefs on Settings (operator). Teammate: alerts read-only.

---

## 9. Empty & error states

| Context | Message (EN example) | CTA |
|---------|----------------------|-----|
| No groups | “You are not in any group yet.” | Create group |
| No tasks (My work) | “No tasks assigned to you yet.” | — (toolbar New task) |
| No members (Team board) | “Add members to start coordinating work.” | — |
| No events / alerts | “No alerts yet…” | — |
| No group projects | Quiet list-filter link to `/projects` | Projects tab |
| Empty todo column | Light placeholder | — |
| Login failed | “Invalid email or password.” | — |
| Session expired | Redirect + toast | Log in again |
| Telegram delivery failed | Detail banner; card corner-dot | — |

---

## 10. Telegram UX (companion to web)

Message shapes only. Keywords / delivery rules: [REQUIREMENTS §5.6](./REQUIREMENTS.md#56-telegram-bot).

### Task notification

```
SHP · Task title
Group: Demo Shop

Description (truncated…)

Due: 2026-03-15
Difficulty: Medium
Open: https://app.example.com/en-gb/tasks/{id}

Reply to THIS message with: done · in progress (or hecho / feito / working).
```

Wrong-thread reply → short hint to use Reply on the task notification.

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

Localized per user locale (`en-gb` / `es-es` / `pt-br`).

---

## 11. Components (implementation)

| Component | Notes |
|-----------|-------|
| `AppShell` / `AppHeader` / `MobileTopBar` | Same 5-tab nav + chrome |
| `GroupSwitcher` + `GroupPanelMenu` | Switch · create · join |
| `GroupDangerSettings` | Leave / delete |
| `LocaleSwitcher` / `LocalePicker` / `UserMenu` | Header utilities |
| `UserAvatar` / `ProfileAvatarEditor` | Photo |
| `TaskFormFields` / `CreateTaskForm` / `EditTaskForm` | Shared forms |
| `BoardTaskCard` / `TaskCardMenu` / `TaskProjectPicker` | Board cards + ⋯ / acronym segments |
| `StatusKanban` / `TeamBoard` / `BoardQuickAddTask` | Boards |
| `TaskList` / `ViewToggle` / `ScopeToggle` | List table (title / project / category edit) + toolbar |
| `StatusBadge` / `MemberNameRow` / `MemberStatusIcons` | Labels / icons |
| `TelegramStatusIcon` / `AccountInactiveIcon` / `ToneBadge` | Status marks |
| `PromoteTeammateButton` / `DemoteOperatorButton` / `TransferOwnershipButton` / `RemoveTeammateButton` | Teammate detail |
| `ProjectsManager` | `/projects` — pending band + accepted card grid |
| `Banner` / `Toast` / `SyncBar` | Page-state · success as floating card (3s, Family A) · sync |

**Styling:** Tailwind + `brand/brand.css` — [BRAND.md](./BRAND.md).

**Interaction families:**

| Family | Pattern | Used by |
|--------|---------|---------|
| **A** | `useFadeOpen` + `useDismissable` + `popoverStyles` (~200ms open / ~300ms close) | User · Locale · Group · `Select` · list project/category pickers · `Toast` (3s, no outside-click) |
| **B** | Segmented control | Scope / View toggles |
| **C** | Horizontal segment (same fade timings) | Board ⋯ menu · acronym picker |

---

## 12. Responsive summary

| Breakpoint | Shell | Team | My work |
|------------|-------|------|---------|
| ≥768px | Sidebar + header utilities | Member columns (H-scroll) | 3-column Kanban |
| <768px | Top bar + tabs | Board or list | Kanban stacks; list: title + wrapping meta, 2-col filters |

---

## 13. Phase mapping

| UX item | Phase | Status |
|---------|-------|--------|
| Landing, boards, forms, scopes, Profile/Settings | 1 | Shipped |
| Queue DnD + status drops | 1 | Shipped |
| Events + operator alerts | 1 | Shipped |
| Group activity + platform admin | 2 | Shipped |
| Sidebar collapse | 3 (P3-11) | In UI |
| Kanban touch / a11y polish | 3 (P3-03) | Core in Phase 1 |
| Native apps | 3 (P3-13) | — |
| Group projects (`/projects` + acronym on tasks) | 3 (P3-16) | Implemented |
| Contact + signup verify + forgot/reset | 3 (P3-17) | Implemented |

---

## Revision history

| Date | Change |
|------|--------|
| 2026-10-12 | P3-17 docs sync (screen inventory + phase map) |
| 2026-10-12 | P3-17 contact + auth email pages |
| 2026-09-20 | P3-16 Projects tab `/projects`; project heading `SIR · Name` like task cards; list inline title/project/category |
| 2026-08-16 | Teammate read-only Teammates + Events; group activity operator-only |
| 2026-08-15 | P3-16 group projects: Settings card; list filter; no fifth tab; card acronym segment (Family C) |
| 2026-08-15 | Success flash → floating `Toast` card (3s, Family A). `Banner` kept for page-state / errors |
| 2026-07-26 | Doc contract vs REQUIREMENTS; trim product-rule restatements; card/menu + Family A/B/C in one place |
| 2026-07-25 | Board ⋯ segment (Open · Clone · Delete); description preview; Done Show more; Family A Select/popovers; scope URL |
| 2026-07-23 | My work \| Team scope; member identity icons; teammates list columns |
| 2026-07-22 | Invisible owner transfer / succession UX |
| 2026-07-21 | `TeamBoard` / `BoardTaskCard` rename; board pan via chrome only |
| 2026-07-20–18 | Self column naming; queue DnD; Telegram on Profile; landing voice |
| 2026-07-14–11 | Invite join UX; user→group→role model; marketing landing |
| 2026-06-28–27 | Shell, Profile/Settings split, status labels, operator board |
