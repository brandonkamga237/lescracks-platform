# Animation plans

Self-contained implementation plans from the animation audit of commit `139d15a`. Each plan inlines its exact values and code; an executor needs no other context.

| # | Plan | Severity | Status |
|---|------|----------|--------|
| 001 | [Reduced motion: keep the fades, drop the movement](001-reduced-motion-keeps-fades.md) | MEDIUM | DONE |
| 002 | [Mobile menu opens from its trigger](002-mobile-menu-opens-from-trigger.md) | MEDIUM | DONE |
| 003 | [Name the transitioned properties on admin list rows](003-admin-table-named-transition.md) | LOW | DONE |
| 004 | [The filter underline slides to the chosen filter](004-filter-underline-slides.md) | LOW | DONE |

## Execution order

1. **002** before **001**: 002 reshapes `DialogContent` in `frontend/src/components/ui/dialog.tsx`; 001's dialog override targets `[role="dialog"][data-state]` and must be verified on the menu as 002 leaves it.
2. **001**.
3. **003** and **004** are independent of everything else and of each other; run them in any order.

## Not planned (audit notes)

- Floating WhatsApp label widens by animating `max-width` / `padding-left` (`frontend/src/components/layout/Layout.tsx:74`). Layout-triggering, but on a small fixed element the cost is negligible; a `clip-path: inset()` reveal is the fix if it ever shows up in a profile.
- « Explorer par sujet » grid enters as one block (`frontend/src/pages/Landing.tsx:230`); a 40ms stagger would be polish.
- « Affiner » panel (`frontend/src/pages/Ressources.tsx:151`) and the newsletter bar dismissal (`frontend/src/components/layout/NewsletterBar.tsx:28`) change layout instantly.
- The Landing « réseau » line illustration could draw itself once on reveal.
