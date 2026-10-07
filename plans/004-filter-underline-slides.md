# 004 — The filter underline slides to the chosen filter

- **Status**: DONE
- **Commit**: 139d15a
- **Severity**: LOW (missed opportunity — additive)
- **Category**: Missed opportunities / state indication
- **Estimated scope**: 1 file, ~30 lines

## Problem

`FilterChips` is the only filter control on the public site (Bibliothèque format filter, Agenda type and format filters). The active filter is marked by a 1px gold underline that is rendered *inside* the active button, so changing the filter makes the underline vanish under one label and reappear under another. The state change teleports; nothing connects "what was selected" to "what is selected now".

```tsx
// frontend/src/components/common/FilterChips.tsx:27-46 — current
    <fieldset className="flex flex-wrap items-end gap-x-7 border-b border-line-soft">
      <legend className="sr-only">{legend}</legend>
      {entries.map(([option, label]) => {
        const active = value === option;
        return (
          <button
            key={option ?? '__all'}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`relative inline-flex min-h-11 items-center pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
              active ? 'text-gold-ink' : 'text-t3 hover:text-t1'
            }`}
          >
            {label}
            {active && <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-gold-400" />}
          </button>
        );
      })}
    </fieldset>
```

Used by `frontend/src/pages/Ressources.tsx:126` and `frontend/src/pages/Evenements.tsx:69-70`.

## Target

One underline element per `FilterChips`, positioned under the active button and moving to the newly active one:

- Moves with `transform` only: `translate(x, y) scaleX(width)` on a 1px × 1px element with `transform-origin: left` — no `left`/`width` animation.
- Movement on screen ⇒ the repo's `ease-in-out` (= `var(--ease-in-out)` = `cubic-bezier(0.77, 0, 0.175, 1)`), **250ms**.
- No transition on the first paint (the underline must not fly in from the corner when the page loads); transitions are enabled one frame after the first measurement.
- Re-measured when the control resizes or wraps (ResizeObserver), so it stays aligned on mobile where the chips wrap onto two lines.
- Reduced motion: `motion-reduce:transition-none` — the underline jumps, the label colour still changes.
- Same visual position as today: the line sits on the fieldset's bottom rule, under the full width of the active label.

## Repo conventions to follow

- Imports through `@/…`; English code and comments, comments only for the *why*.
- Tailwind classes for styling. Inline `style` is the accepted exception for measured runtime values (precedent: `frontend/src/components/admin/viz.tsx:200` sets a measured `width` inline); add a one-line comment saying so.
- Curves come from the repo tokens via Tailwind (`ease-in-out` is overridden in `frontend/tailwind.config.js` to `var(--ease-in-out)`). Do not hand-type a cubic-bezier.

## Steps

1. **`frontend/src/components/common/FilterChips.tsx`** — add at the top of the file:

   ```tsx
   import { useEffect, useLayoutEffect, useRef, useState } from 'react';
   ```

2. **Same file, inside `FilterChips`**, right after the `const entries = …` line, add:

   ```tsx
     const listRef = useRef<HTMLFieldSetElement>(null);
     const [indicator, setIndicator] = useState<{ x: number; y: number; width: number } | null>(null);
     // Transitions start one frame after the first measure, so the line never flies in on page load.
     const [ready, setReady] = useState(false);
     const activeIndex = entries.findIndex(([option]) => option === value);

     useLayoutEffect(() => {
       const list = listRef.current;
       if (!list) return;
       const measure = () => {
         const active = list.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
         setIndicator(active ? { x: active.offsetLeft, y: active.offsetTop + active.offsetHeight, width: active.offsetWidth } : null);
       };
       measure();
       const observer = new ResizeObserver(measure);
       observer.observe(list);
       list.querySelectorAll('button').forEach((button) => observer.observe(button));
       return () => observer.disconnect();
     }, [activeIndex]);

     useEffect(() => {
       const frame = requestAnimationFrame(() => setReady(true));
       return () => cancelAnimationFrame(frame);
     }, []);
   ```

3. **Same file, the `<fieldset>`** — add the ref and `relative`:

   ```tsx
       <fieldset ref={listRef} className="relative flex flex-wrap items-end gap-x-7 border-b border-line-soft">
   ```

4. **Same file, inside each `<button>`** — delete the line:

   ```tsx
               {active && <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-gold-400" />}
   ```

   The button's own `relative` class can stay.

5. **Same file, just before `</fieldset>`** (after the `entries.map(…)` block), add:

   ```tsx
         {indicator && (
           <span
             aria-hidden
             className={`pointer-events-none absolute left-0 top-0 h-px w-px origin-left bg-gold-400 ${ready ? 'transition-transform [transition-duration:250ms] ease-in-out motion-reduce:transition-none' : ''}`}
             // Measured at runtime: position and width come from the active button.
             style={{ transform: `translate(${indicator.x}px, ${indicator.y}px) scaleX(${indicator.width})` }}
           />
         )}
   ```

## Boundaries

- Only `frontend/src/components/common/FilterChips.tsx` changes. Do NOT touch `Ressources.tsx`, `Evenements.tsx` or the props interface.
- Keep `aria-pressed`, the 44px touch target (`min-h-11`), the labels and the colour classes exactly as they are.
- Do NOT add dependencies (no framer-motion `layoutId` — plain transform is enough here).
- If the quoted code no longer matches (drift since commit `139d15a`), STOP and report.

## Verification

- **Mechanical** (from `frontend/`): `pnpm typecheck` → no errors; `pnpm lint` → 0 errors (6 pre-existing warnings are fine); `pnpm build` → succeeds.
- **Feel check**: `pnpm dev`, open http://localhost:5173/ressources:
  - On load the gold line is already under « Tout », with no movement.
  - Click « Ebooks » then « Vidéos » then « Tout »: the line slides and stretches to each label in ~250ms; the label colour changes at the same time.
  - Click two filters quickly: the line retargets mid-slide from where it is, it never restarts from the first position.
  - DevTools → *Animations* at 10%: only `transform` animates; the line's left edge lines up with the label's left edge and its width with the label's width at the end.
  - Open http://localhost:5173/evenements at 390px wide, where the chips wrap: the line sits under the active chip on either row, including after rotating/resizing the window.
  - DevTools → *Rendering* → emulate `prefers-reduced-motion: reduce`: the line jumps instantly, colours still change.
- **Done when**: a single underline element per control slides between filters with transform-only motion, starts static on load, and stays aligned when the chips wrap.
