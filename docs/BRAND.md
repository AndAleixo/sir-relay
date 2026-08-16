# Sir — Brand & Visual Identity

**SirRelay** visual and voice guidelines.  
**Palette:** white, black, yellow (gold/amber), gray.

**Companion docs:** [UIUX.md](./UIUX.md) (UI usage) · [REQUIREMENTS.md](./REQUIREMENTS.md) (P1-UI-01) · [README.md](../README.md)

---

## 1. Brand architecture

| Level | Name | Role |
|-------|------|------|
| **Brand** | **Sir** | Parent brand — trust, clarity |
| **Product** | **SirRelay** | Hosted web task relay + Telegram bot |
| **Wordmark** | **SRelay** | UI logo (landing, login, sidebar open) |
| **Mark** | **SR** | Compact logo, favicon, Telegram avatar |
| **Repo / package** | `sir-relay` | Technical identifier |

**Tagline (optional):** *Relay work. Get it done.*

**Marketing voice:** Calm, direct, small-team scale — avoid KPI/“10× productivity” language. Landing and product UI share the same palette ([UIUX.md §2.0](./UIUX.md#20-marketing-landing)).

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

| Status | Color | Hex / token |
|--------|-------|-------------|
| To do | Gray | `#A3A3A3` · `--status-todo` |
| In progress (`doing`) | **Brand yellow** | `#EAB308` · `--status-progress` |
| Done | Dark gray | `#404040` · `--status-done` |
| Error / overdue / hard difficulty text | Red | `#DC2626` · `--severity` |

**Overdue due dates** and **hard** difficulty use the **same** red (`--severity`). Soft fill for hard handle: `--severity-soft` `#FEE2E2`.

### 2.2.1 Task difficulty (board ⠿ handle)

Optional field; tint only the drag handle (not the whole card).

| Difficulty | Background | Text | Tokens |
|------------|------------|------|--------|
| Easy | `#D1FAE5` | `#065F46` | `--difficulty-easy-bg` / `--difficulty-easy-fg` |
| Medium | `#FEF3C7` | `#78350F` | `--difficulty-medium-bg` / `--difficulty-medium-fg` |
| Hard | `#FEE2E2` (`--severity-soft`) | `#DC2626` (`--severity`) | `--difficulty-hard-bg` / `--difficulty-hard-fg` |
| Unset | none | muted gray | default handle |

Do not invent ad-hoc Tailwind greens/roses in task UI — use these tokens from [`brand/brand.css`](../brand/brand.css).

**UI variants:** Button / Banner use `variant="severity"` for this red. Settings “danger zone” copy stays as product language only.

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

Wordmark is **SRelay** (Sir → **S**, product **Relay**). Collapse by dropping **elay** → **SR**. Chrome (tab title, logo alt) uses **SRelay**. Prose, legal, and FAQ still say **SirRelay**.

### 3.1 The three assets

| Asset | File | Background | Content |
|-------|------|------------|---------|
| **Icon** | [`icon.svg`](./icon.svg) | **Yellow** square `#EAB308` | **SR** + progress track |
| **Logo compact** | [`logo-compact.svg`](./logo-compact.svg) | **Transparent** | **SR** + progress track |
| **Logo extended** | [`logo.svg`](./logo.svg) | **Transparent** | **SRelay** + extended track |

**Icon** = app mark (favicon, Telegram avatar, PWA). Two letters so it survives 16–32px.  
**Logo** = wordmark for UI headers — same *shape* as the icon (text above, track below) but **no yellow fill**.

```
Icon (yellow):          Logo compact (transparent):    Logo extended (transparent):

┌──────────┐            SR                             SRelay
│   SR     │            ——●——                          ——●——
│  ——●——   │
└──────────┘
```

### 3.2 Visual rules

- Logo layout **mirrors** icon interior: text centered, 3-node track below.
- Same typography: `S` `#0A0A0A` + `R` `#CA8A04` + `elay` `#0A0A0A` on the extended mark.
- Extended track is **wider** than compact; node spacing scales with name length.
- Icon and logo are **not combined** in one file — header may show logo only, or logo + icon side by side if needed.

### 3.3 SRelay → SR

The app **swaps two SVG files** (sidebar collapse, mobile header). Do not animate icon ↔ logo.

| State | File / content |
|-------|----------------|
| **Extended** | `logo.svg` — SRelay + track |
| **Compact** | `logo-compact.svg` — SR + track |

Duration of the cross-fade in chrome: ~300ms. **Icon (`icon.svg`) stays SR.**

```
Extended:   SRelay            Compact:   SR
            ——●——                         ——●——
```

### 3.4 Files

| File | Use |
|------|-----|
| [`brand/icon.svg`](./icon.svg) | Favicon, bot avatar source, app icon (**SR**) |
| [`brand/logo-compact.svg`](./logo-compact.svg) | Header collapsed / mobile, transparent **SR** |
| [`brand/logo.svg`](./logo.svg) | Login, landing, header expanded, transparent **SRelay** |
| [`brand/bot-avatar.svg`](./bot-avatar.svg) | Telegram 512×512 (yellow **SR** icon) |
| [`public/favicon.svg`](../public/favicon.svg) | Next.js favicon |

### 3.5 Usage

```
Favicon / Telegram / app icon:     icon.svg  (yellow SR)

Header expanded / login / landing: logo.svg  (transparent SRelay)

Header collapsed / mobile:         logo-compact.svg  (transparent SR)
```

### 3.6 Clear space & size

**Clear space:** padding ≥ height of one track node around the logo.  
**Minimum logo width:** compact 56px, extended 96px.  
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
| **SR** (icon + compact) | `S` black + `R` amber |
| **SRelay** (extended logo) | `S` + `R` amber + `elay` black |

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
| Display name | SRelay |
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
  icon.svg           # yellow SR mark
  logo-compact.svg   # transparent SR
  logo.svg           # transparent SRelay
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
| 2026-08-16 | Wordmark **SRelay**; compact + yellow icon **SR** |
| 2026-08-13 | Renamed `--danger` → `--severity` (overdue, hard, errors, destructive) |
| 2026-08-13 | Task difficulty tokens; overdue shares `--severity` with hard |
| 2026-06-25 | Initial draft (navy palette) |
| 2026-06-25 | Icon (yellow) vs logo (transparent text+track); then compact SirR / extended SirRelay |
