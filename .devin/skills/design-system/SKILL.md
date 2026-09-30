---
name: design-system
description: The LesCracks visual system — poster-studio black/white duality with a single gold accent, DM Sans bold stacked headlines, 4px radii, charcoal surfaces. Use for any public page, component or restyle of the frontend.
---

# LesCracks — Design System

> Poster studio on matte black — bold stacked type, chalk-white sections, a single gold pulse.

Adapted from a Skillshare-style reference: same structure (black/white duality, stacked
display type, flat 4px geometry, one accent doing maximum work), with **gold replacing the
green** so the LesCracks identity stays black + gold.

## Principles

1. **Two modes, no transitional greys.** A section is either MODE BLACK or MODE WHITE. The
   colour change *is* the separator — no gradient, no divider line between sections.
2. **One accent.** Gold is the only colour. It fills the primary CTA and marks tiny moments
   (checkmarks, active states, key figures). Never a large background fill.
3. **Poster type.** Headlines are DM Sans 700 with 0.90–0.96 line-height at 36px+. Stacked,
   dense, confident. Body stays airy (1.50).
4. **Flat geometry.** 4px radius on buttons, inputs and cards; 8px on elevated tiles; 100px
   only on pills/tags/avatars — never on buttons.
5. **Depth by surface, not shadow, on black.** `#232424` lifts a tile off `#000`. Shadows exist
   only on white.
6. **Identity over ornament.** Photography and real content fill cards edge-to-edge; no
   decorative numbering, no text walls.

## Colour tokens

| Name | Value | Tailwind | Role |
|------|-------|----------|------|
| Studio Black | `#000000` | `bg-noir-950` / mode black | Dark section background |
| Pure White | `#ffffff` | `bg-white` / mode white | Light section background, text on black |
| Deep Ink | `#0b1215` | `text-t1` inside `.mode-light` | Primary text on white |
| Graphite Stroke | `#394649` | `border-line-strong` in light | Outlined buttons on white, secondary text |
| Fog Border | `#e0e0e0` | `border-line` in light | Inputs, dividers on white |
| Ash Mid | `#757575` | `text-t4` in light | Placeholders, fine print |
| Charcoal Surface | `#232424` | `bg-card` / `bg-noir-800` in dark | Tiles and cards on black |
| **Gold** (replaces Skill Green) | `#d4af37` | `bg-gold-400` | Primary CTA fill (text `#000`), brand accent |
| **Gold Glow** (replaces Neon Pulse) | `#f0c451` | `text-gold-300` | Checkmarks, small active marks on black only |
| **Gold Ink** (replaces Creator Violet) | `#d4af37` on black / `#8a6a1c` on white | `text-gold-ink` | Accent text & ghost links — AA on both modes |
| Gold Pressed | `#b8962e` | `bg-gold-500` | Hover/pressed CTA |

Cyan, violet and any second accent are **not used**. Semantic green/red only for form
feedback and status.

### Inversion mechanism

Text, lines and surfaces are CSS variables. Wrapping a section in `.mode-light` flips them:

| Token | Mode black | `.mode-light` |
|-------|-----------|---------------|
| `text-t1` | `#ffffff` | `#0b1215` |
| `text-t2` | white 78% | `#263033` |
| `text-t3` | white 60% | `#4a5557` |
| `text-t4` | white 50% | `#6b6b6b` |
| `border-line` | white 12% | `#e0e0e0` |
| `border-line-strong` | white 20% | `#394649` |
| `bg-card` | `#232424` | `#ffffff` (+ `shadow-sm`) |
| `bg-noir-800` | `#232424` | `#f4f4f4` |
| `text-gold-ink` | `#d4af37` | `#8a6a1c` |

So a component written once with `text-t1`, `bg-card`, `border-line`, `text-gold-ink` renders
correctly in either mode. **Never hardcode `text-white` / `bg-black` inside reusable
components** — use the ramp. `text-gold-400` (raw gold) is for black sections only.

## Typography

- **Family:** DM Sans (substitute for GT Walsheim Pro) for everything. JetBrains Mono only for
  code.
- **Weights:** 400 body · 500 buttons/labels · 600 CTAs · 700 headlines.

| Role | Size | Weight | Line height | Tailwind |
|------|------|--------|-------------|----------|
| caption / label | 11px | 500 | 1.45 | `.label` (uppercase, 0.1em tracking) |
| body | 16px | 400 | 1.50 | default `p` |
| subheading | 20px | 600 | 1.30 | `text-xl font-semibold` |
| heading-sm | 28px | 700 | 1.25 | `h3` |
| heading | 38px | 700 | 1.10 | `h2` |
| heading-lg | 46px | 700 | 0.96 | `.display-lg` |
| display | 48–72px | 700 | 0.90 | `h1` / `.display` |

Rules: tight line-height (<1.1) only at 36px+; body never below 1.40 at 13–18px; ALL-CAPS
labels always tracked 0.1em.

## Spacing & shape

- Base unit 8px. Section padding 80–120px vertical (`py-20 lg:py-28`). Max width 1280px
  (`max-w-7xl`). Card padding 16px, element gap 8–12px.
- Radius: `rounded` (4px) buttons/inputs/cards · `rounded-lg` (8px) elevated tiles · `rounded-full`
  pills/avatars only.
- Shadows (white mode only): `shadow-sm` = `0 2px 4px rgba(0,0,0,.1)`.

## Components

- **Primary CTA** — `.btn-primary`: gold fill, black 600 text, 4px radius. The only filled
  colour button. Same on black and white.
- **Secondary** — `.btn-secondary`: transparent, 1px `line-strong` border (graphite on white,
  white 20% on black), `text-t1`.
- **Ghost link** — `.link`: `text-gold-ink`, underline on hover.
- **Stat tile** — on black: `bg-card rounded-lg p-4`, value 34–38px 700 `text-t1`, `.label`
  below in `text-t4`. Four in a row.
- **Checklist** — gold-glow check icon (20px) + 16px body, 12px gap, no container.
- **Portrait / cover card** — zero padding, image fills the card, bottom scrim
  `from-black/70 to-transparent` over 40%, white label/title on it.
- **Input** — `.input`: transparent, 1px `line` border, 4px radius, placeholder `text-t4`,
  gold focus ring.
- **Header** — white (`.mode-light`) sticky ~64px: logo left, nav center, "Se connecter"
  text + gold CTA right.

## Do / Don't

**Do**
- Alternate full-bleed black and white bands; hard edges between them.
- Put the gold CTA on both modes as a *filled* button.
- Use `bg-card` (#232424) to lift tiles on black.
- Keep photography edge-to-edge with a scrim for text.

**Don't**
- Don't fill sections or badges with gold.
- Don't use `text-gold-400` on white — use `text-gold-ink` (AA contrast).
- Don't put shadows on black-mode components.
- Don't round buttons with `rounded-full`, or add radius to full-bleed imagery.
- Don't reintroduce serif display type, decorative numbering or grey section backgrounds.
