# Sir — Brand & Visual Identity

**SirRelay** visual and voice guidelines.  
**Palette:** white, black, yellow (gold/amber), gray.

---

## 1. Brand architecture

| Level | Name | Role |
|-------|------|------|
| **Brand** | **Sir** | Parent brand — trust, clarity |
| **Product** | **SirRelay** | Task relay app (web admin + Telegram bot) |
| **Repo / package** | `sir-relay` | Technical identifier |

**Tagline (optional):** *Relay work. Get it done.*

---

## 2. Color system

**Principle:** ~70% white/light gray surfaces, black text, gray structure, **yellow only as accent** (5–10% of UI).

### 2.1 Core tokens

| Token | Hex | Use |
|-------|-----|-----|
| `--brand-accent` | `#EAB308` | Primary buttons, links, active nav, favicon, bot avatar, In progress status |
| `--brand-accent-hover` | `#CA8A04` | Button / link hover |
| `--brand-accent-soft` | `#FEF9C3` | Subtle highlight backgrounds |
| `--text-primary` | `#0A0A0A` | Headings, body |
| `--text-muted` | `#6B7280` | Labels, secondary text |
| `--surface-bg` | `#F5F5F5` | App background |
| `--surface-card` | `#FFFFFF` | Cards, Kanban columns |
| `--border` | `#E5E5E5` | Dividers, column borders |
| `--gray-strong` | `#525252` | Emphasis without black |

### 2.2 Status (Kanban & badges)

| Status | Color | Hex |
|--------|-------|-----|
| To do | Gray | `#A3A3A3` |
| In progress (`doing`) | **Brand yellow** | `#EAB308` |
| Done | Dark gray | `#404040` |
| Error / overdue | Red | `#DC2626` |

### 2.3 Contrast rules

- **Yellow buttons:** background `#EAB308` + text `#0A0A0A` (never yellow text on white).
- **Yellow as text:** only on dark backgrounds (black / dark gray).
- Avoid large solid yellow areas — use for CTAs, badges, mark.

### 2.4 Color test sheet

Visual reference: [`brand/palette.svg`](./palette.svg)  
CSS variables: [`brand/brand.css`](./brand.css)

---

## 3. Logo & icon

Three related assets — **do not mix icon and logo roles.**

### 3.1 The three assets

| Asset | File | Background | Content |
|-------|------|------------|---------|
| **Icon** | [`icon.svg`](./icon.svg) | **Yellow** square `#EAB308` | SirR + progress track |
| **Logo compact** | [`logo-compact.svg`](./logo-compact.svg) | **Transparent** | **SirR** + progress track |
| **Logo extended** | [`logo.svg`](./logo.svg) | **Transparent** | **SirRelay** + extended track |

**Icon** = app mark (favicon, Telegram avatar, PWA).  
**Logo** = wordmark for UI headers — same *shape* as the icon (text above, track below) but **no yellow fill**.

The **only difference** between logo compact and logo extended is the **text** (and track width).

```
Icon (yellow):          Logo compact (transparent):    Logo extended (transparent):

┌──────────┐            SirR                           SirRelay
│  SirR    │            ——●——                          ——●——
│  ——●——   │
└──────────┘
```

### 3.2 Visual rules

- Logo layout **mirrors** icon interior: text centered, 3-node track below.
- Same typography: `Sir` `#0A0A0A` + `R` `#CA8A04`.
- Extended track is **wider** than compact; node spacing scales with name length.
- Icon and logo are **not combined** in one file — header may show logo only, or logo + icon side by side if needed.

### 3.3 SirRelay → SirR motion (planned UI)

Animate between **two transparent logos** — not between icon and logo.

| State | File / content |
|-------|----------------|
| **Extended** | `logo.svg` — SirRelay + track |
| **Compact** | `logo-compact.svg` — SirR + track |

**Triggers:** sidebar collapse, narrow header, user toggle.

**Implementation:**

- Animate `#wm-elay` opacity in `logo.svg` or swap SVGs
- Reference: [`brand/logo-motion.css`](./logo-motion.css)
- Duration: 220–300ms ease-out
- **Icon (`icon.svg`) stays unchanged** — used separately for favicon/bot

```
Extended:   SirRelay          Compact:   SirR
            ——●——                         ——●——
```

### 3.4 Files

| File | Use |
|------|-----|
| [`brand/icon.svg`](./icon.svg) | Favicon, bot avatar source, app icon |
| [`brand/logo-compact.svg`](./logo-compact.svg) | Header collapsed, transparent SirR |
| [`brand/logo.svg`](./logo.svg) | Login, header expanded, transparent SirRelay |
| [`brand/logo-motion.css`](./logo-motion.css) | Extended ↔ compact transition |
| [`brand/bot-avatar.svg`](./bot-avatar.svg) | Telegram 512×512 (yellow icon) |
| [`public/favicon.svg`](../public/favicon.svg) | Next.js favicon |

### 3.5 Usage

```
Favicon / Telegram / app icon:     icon.svg  (yellow)

Header expanded / login:           logo.svg  (transparent SirRelay)

Header collapsed / narrow:         logo-compact.svg  (transparent SirR)
```

### 3.6 Clear space & size

**Clear space:** padding ≥ height of one track node around the logo.  
**Minimum logo width:** compact 56px, extended 120px.  
**Icon minimum:** 24px.  
**Do not:** add yellow background to logos; do not stretch or rotate.

### 3.7 Export bot avatar (when needed)

```bash
# Example with Inkscape or rsvg-convert
rsvg-convert -w 512 -h 512 brand/bot-avatar.svg -o public/bot-avatar.png
```

---

## 4. Typography

| Use | Font | Fallback |
|-----|------|----------|
| UI & wordmark | **Inter** | system-ui, sans-serif |
| Monospace | **JetBrains Mono** | monospace |

| Element | Style |
|---------|--------|
| **SirR** (icon mark) | `Sir` black + `R` amber inside yellow square |
| **SirRelay** (extended logo) | `Sir` + `R` amber + `elay` black |

SVG logos embed `Inter` with system-ui fallback until web fonts load in app.

---

## 5. Brand personality

| Trait | Expression |
|-------|------------|
| **Clear** | Short copy; no jargon |
| **Reliable** | Calm gray/white UI; yellow only draws attention |
| **Human** | Polite bot copy |
| **Light** | Small-team tool |

**Avoid:** medieval imagery, neon yellow everywhere, corporate blue default look.

---

## 6. UI patterns

| Property | Value |
|----------|--------|
| Card radius | `8px` |
| Button radius | `6px` |
| Primary button | bg `#EAB308`, text `#0A0A0A`, hover `#CA8A04` |
| Page layout | `#F5F5F5` bg, white cards, gray borders |
| Kanban | White columns on gray bg; yellow accent on In progress column header |

### Env overrides (optional)

```
BRAND_ACCENT=#EAB308
BRAND_LOGO_URL=           # optional CDN override
```

---

## 7. Telegram bot

| Field | Value |
|-------|-------|
| Display name | SirRelay |
| Username | `@SirRelayBot` (finalize at BotFather) |
| Avatar | `brand/bot-avatar.svg` → 512×512 PNG |
| Description | Task relay for your team. Reply to update your work. |

---

## 8. Asset checklist

| Asset | Status |
|-------|--------|
| Color tokens | Done — `brand/brand.css` |
| Palette test sheet | Done — `brand/palette.svg` |
| Icon (yellow) | Done — `brand/icon.svg` |
| Logo compact (transparent) | Done — `brand/logo-compact.svg` |
| Logo extended (transparent) | Done — `brand/logo.svg` |
| Bot avatar (SVG) | Done — `brand/bot-avatar.svg` |
| Favicon in public | Done — `public/favicon.svg` |
| Bot avatar PNG | Export when registering bot |
| Tagline final | Optional |

---

## 9. Code integration (Phase 1)

```
brand/
  icon.svg           # yellow mark
  logo-compact.svg   # transparent SirR
  logo.svg           # transparent SirRelay
  logo-motion.css
  brand.css
public/
  favicon.svg        # copy of icon
```

- Import `brand/brand.css` in Next.js `globals.css`
- Map tokens in `tailwind.config` → `colors.brand.accent`, etc.
- Header expanded: `logo.svg` — collapsed: `logo-compact.svg` — favicon: `icon.svg`

---

## Revision history

| Date | Change |
|------|--------|
| 2026-06-25 | Initial draft (navy palette) |
| 2026-06-25 | Icon (yellow) vs logo (transparent text+track); logo-compact SirR / logo SirRelay |
