---
name: design-system
description: The LesCracks visual system — poster-studio black bands (pure and raised) with a single gold accent, DM Sans bold stacked headlines, 4px radii, charcoal surfaces. Use for any public page, component or restyle of the frontend.
---

# LesCracks — Design System

> Poster studio on matte black — bold stacked type, raised black bands, a single gold pulse.

Adapted from a Skillshare-style reference: same structure (alternating bands, stacked
display type, flat 4px geometry, one accent doing maximum work), with **gold replacing the
green** and **no white surfaces** — the reference's white bands become raised black, because
large white areas are tiring on a black site. The identity is black + gold only.

## Principles

1. **Two shades of black, never white.** A section is either pure black (`#000`) or raised
   black (`.mode-raised`, `#111`). The shade change *is* the separator — no gradient, no divider
   line between sections. White is for text only, never for a surface.
2. **One accent.** Gold is the only colour. It fills the primary CTA and marks tiny moments
   (checkmarks, active states, key figures). Never a large background fill.
3. **Poster type.** Headlines are DM Sans 700 with 0.90–0.96 line-height at 36px+. Stacked,
   dense, confident. Body stays airy (1.50).
4. **Flat geometry.** 4px radius on buttons, inputs and cards; 8px on elevated tiles; 100px
   only on pills/tags/avatars — never on buttons.
5. **Depth by surface, never shadow.** `#232424` lifts a tile off `#000`; `#1c1c1c` lifts a card off
   the raised band.
6. **Identity over ornament.** Photography and real content fill cards edge-to-edge; no
   decorative numbering, no text walls.

## Colour tokens

| Name | Value | Tailwind | Role |
|------|-------|----------|------|
| Studio Black | `#000000` | `bg-black` / `Section` default | Base band background |
| Raised Black | `#111111` | `.mode-raised` / `Section tone="raised"` | Alternate band, header, floating panels |
| Charcoal Surface | `#232424` | `bg-card` / `bg-noir-800` | Tiles and cards on pure black |
| Raised Card | `#1c1c1c` | `bg-card` inside `.mode-raised` | Cards on raised bands |
| Chalk White | `#ffffff` | `text-t1` | Headlines and key figures — text only |
| White 78 / 60 / 50 % | — | `text-t2` / `text-t3` / `text-t4` | Body, metadata, captions (all AA on black) |
| Hairlines | white 8 / 12 / 20 % | `border-line-soft` / `border-line` / `border-line-strong` | Dividers, inputs, outlined buttons |
| **Gold** (replaces Skill Green) | `#d4af37` | `bg-gold-400` / `text-gold-ink` | Primary CTA fill (text `#000`), accent text |
| **Gold Glow** (replaces Neon Pulse) | `#f0c451` | `text-gold-300` | Checkmarks, small active marks |
| Gold Pressed | `#b8962e` | `bg-gold-500` | Pressed CTA |

Cyan, violet, any second accent and any white surface are **not used**. Semantic green/red only
for form feedback and status.

### Band mechanism

Surfaces are CSS variables. `.mode-raised` steps every surface up one notch (`#111` band,
`#1c1c1c` cards, softer hairlines) while the text ramp stays the same. A component written with
`text-t*`, `bg-card`, `bg-noir-8xx`, `border-line*`, `text-gold-ink` renders correctly on either
band. **Never hardcode `bg-white`, `text-black` (outside gold buttons) or hex greys** in reusable
components.

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
- No shadows: depth comes from surface lift. The only exception is a floating action button.

## Components

- **Primary CTA** — `.btn-primary`: gold fill, black 600 text, 4px radius. The only filled
  colour button.
- **Secondary** — `.btn-secondary`: transparent, 1px `line-strong` border, `text-t1`.
- **Ghost link** — `.link`: `text-gold-ink`, underline on hover.
- **Stat tile** — `.stat-tile` (`bg-card rounded-lg p-4`), value 34–38px 700 `text-t1`, `.label`
  below in `text-t4`. Four in a row.
- **Checklist** — gold-glow check icon (20px) + 16px body, 12px gap, no container.
- **Portrait / cover card** — zero padding, image fills the card, bottom scrim
  `from-black/70 to-transparent` over 40%, white label/title on it.
- **Input** — `.input`: transparent, 1px `line` border, 4px radius, placeholder `text-t4`,
  gold focus ring.
- **Header** — raised black (`.mode-raised`) sticky ~64px: logo left, nav center, "Se connecter"
  text + gold CTA right.
- **WhatsApp FAB** — gold pill bottom-right on every public page, black WhatsApp glyph, label
  "Rejoindre la communauté" revealed on hover/focus; links to the community group.

## Do / Don't

**Do**
- Alternate full-bleed pure-black and raised-black bands; hard edges between them.
- Keep the gold CTA *filled*.
- Use `bg-card` (#232424) to lift tiles on black.
- Keep photography edge-to-edge with a scrim for text.

**Don't**
- Don't fill sections or badges with gold.
- Don't introduce white or light-grey surfaces, even for a single section.
- Don't put shadows on cards or tiles.
- Don't round buttons with `rounded-full`, or add radius to full-bleed imagery.
- Don't reintroduce serif display type or decorative numbering.
