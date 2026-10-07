# 001 — Reduced motion: keep the fades, drop the movement

- **Status**: DONE
- **Commit**: 139d15a
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 6 files, ~15 one-line edits

## Problem

When the OS asks for reduced motion, one global rule flattens every animation and transition in the app to 0.01ms. Fades that explain what changed (route change, dialog open/close) disappear along with the movement. Reduced motion should mean *fewer and gentler* animations — keep opacity, remove position and scale changes — not zero.

```css
/* frontend/src/index.css:101 — current */
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }

    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
```

Once that rule goes, these elements still move and have no reduced-motion variant:

```tsx
// frontend/src/pages/Landing.tsx:70, 71, 76, 81, 94 — hero entrance, translateY(8px) → 0
<p className="kicker animate-rise">La plateforme tech francophone</p>
<h1 className="mt-6 animate-rise font-display … [animation-delay:50ms]">
<p className="mt-8 max-w-lg animate-rise text-lg leading-normal text-t3 [animation-delay:100ms]">
<div className="mt-10 flex animate-rise flex-wrap items-center gap-x-6 gap-y-4 [animation-delay:150ms]">
<div className="mode-raised animate-rise rounded-lg border border-line p-7 [animation-delay:200ms] sm:max-w-sm lg:max-w-none">
```

```css
/* frontend/src/index.css:197-208 — press scale on both button classes */
           hover:bg-gold-300 active:scale-[0.97] active:bg-gold-500 disabled:active:scale-100
…
           hover:bg-noir-800 active:scale-[0.97] disabled:active:scale-100
```

```tsx
// frontend/src/components/layout/Layout.tsx:71 — floating WhatsApp button, press scale
className="group fixed bottom-5 right-5 z-40 … transition-[background-color,transform] duration-150 ease-out hover:bg-gold-300 active:scale-[0.97] focus-visible:outline …"
// frontend/src/components/layout/Layout.tsx:74 — WhatsApp label widening
<span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-[max-width,padding-left] duration-200 ease-out group-hover:max-w-[12rem] …">
// frontend/src/components/layout/Layout.tsx:85 — scroll-to-top button, slides 8px and press-scales
className={`fixed bottom-24 right-7 z-30 … active:scale-[0.97] lg:flex ${showScrollToTop ? 'opacity-100' : 'invisible translate-y-2 opacity-0'}`}
// frontend/src/components/talks/TalkSpotlight.tsx:45 — play button grows on hover
<span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-400 text-black transition-transform duration-200 ease-out group-hover:scale-105">
// frontend/src/pages/Profile.tsx:261 and frontend/src/pages/VerifyEmail.tsx:33 — spinners with no reduced variant
<Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
<Loader2 className="h-4 w-4 animate-spin" aria-hidden />
```

The Radix dialog (`frontend/src/components/ui/dialog.tsx:39`) zooms from 0.95 through tailwindcss-animate CSS variables (`--tw-enter-scale`, `--tw-exit-scale`); its zoom must be neutralised under reduced motion while its fade stays.

## Target

- No global flattening rule. `html { scroll-behavior: auto; }` stays.
- Under reduced motion:
  - Route fade (`animate-page-in`, opacity only, 180ms) — **kept**.
  - Hero entrance — becomes the same opacity-only fade: `motion-reduce:animate-page-in` (keyframes `page-in`: opacity 0 → 1, `180ms var(--ease-out) both`, already defined in `frontend/tailwind.config.js`). The existing `[animation-delay:…]` classes stay; a staggered fade is fine.
  - Dialog — fade kept, zoom removed (`--tw-enter-scale: 1`, `--tw-exit-scale: 1`).
  - Button press scales, hover scales, the scroll-to-top 8px slide — removed (`scale-100` / `translate-y-0` under `motion-reduce:`).
  - WhatsApp label — appears without transition (`motion-reduce:transition-none`).
  - Spinners — stopped (`motion-reduce:animate-none`), matching the existing convention.
- Unchanged and already correct: `frontend/src/App.tsx:143` wraps the app in `<MotionConfig reducedMotion="user">`, which makes framer-motion drop transforms and keep opacity for the Landing scroll reveals. `animate-pulse` skeletons are opacity-only and stay.

## Repo conventions to follow

- Reduced-motion variants are written inline with Tailwind's `motion-reduce:` prefix. Exemplar: `frontend/src/components/resources/ResourceCard.tsx:32` → `hover:-translate-y-0.5 motion-reduce:hover:translate-y-0`, and `frontend/src/pages/Profile.tsx:221` → `animate-spin motion-reduce:animate-none`.
- Easing tokens live in `frontend/src/index.css` (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1);`). Do not add new curves.
- Comments explain *why*, in English, and stay short.

## Steps

1. **`frontend/src/index.css:101-112`** — replace the whole `@media (prefers-reduced-motion: reduce) { … }` block with:

   ```css
     /* Reduced motion keeps fades (they explain what changed) and drops movement, element by
        element with `motion-reduce:`. The dialog's zoom lives in tailwindcss-animate variables,
        so it is neutralised here. */
     @media (prefers-reduced-motion: reduce) {
       html { scroll-behavior: auto; }

       [role="dialog"][data-state] {
         --tw-enter-scale: 1 !important;
         --tw-exit-scale: 1 !important;
       }
     }
   ```

2. **`frontend/src/index.css`, `.btn-primary`** — change the line
   `hover:bg-gold-300 active:scale-[0.97] active:bg-gold-500 disabled:active:scale-100`
   to
   `hover:bg-gold-300 active:scale-[0.97] active:bg-gold-500 disabled:active:scale-100 motion-reduce:active:scale-100`

3. **`frontend/src/index.css`, `.btn-secondary`** — change the line
   `hover:bg-noir-800 active:scale-[0.97] disabled:active:scale-100`
   to
   `hover:bg-noir-800 active:scale-[0.97] disabled:active:scale-100 motion-reduce:active:scale-100`

4. **`frontend/src/pages/Landing.tsx`** — on each of the five elements carrying `animate-rise` (lines 70, 71, 76, 81, 94), add `motion-reduce:animate-page-in` right after `animate-rise`. Example for line 70:
   `<p className="kicker animate-rise motion-reduce:animate-page-in">La plateforme tech francophone</p>`

5. **`frontend/src/components/layout/Layout.tsx:71`** — after `active:scale-[0.97]` add `motion-reduce:active:scale-100`.

6. **`frontend/src/components/layout/Layout.tsx:74`** — after `transition-[max-width,padding-left] duration-200 ease-out` add `motion-reduce:transition-none`.

7. **`frontend/src/components/layout/Layout.tsx:85`** — after `active:scale-[0.97]` add `motion-reduce:active:scale-100 motion-reduce:translate-y-0`.

8. **`frontend/src/components/talks/TalkSpotlight.tsx:45`** — after `group-hover:scale-105` add `motion-reduce:transition-none motion-reduce:group-hover:scale-100`.

9. **`frontend/src/pages/Profile.tsx:261`** — `className="h-4 w-4 animate-spin"` → `className="h-4 w-4 animate-spin motion-reduce:animate-none"`.

10. **`frontend/src/pages/VerifyEmail.tsx:33`** — `className="h-4 w-4 animate-spin"` → `className="h-4 w-4 animate-spin motion-reduce:animate-none"`.

## Boundaries

- Do NOT touch `frontend/src/App.tsx` (MotionConfig is already correct) or the Landing `REVEAL` constant.
- Do NOT change durations, curves or markup structure — reduced-motion variants only.
- Do NOT add dependencies.
- If any quoted line does not match the file (drift since commit `139d15a`), STOP and report instead of improvising.

## Verification

- **Mechanical** (from `frontend/`): `pnpm typecheck` → no errors; `pnpm lint` → 0 errors (6 pre-existing warnings are fine); `pnpm build` → succeeds.
- **Feel check**: `pnpm dev`, open http://localhost:5173 in Chrome, DevTools → *Rendering* → *Emulate CSS media feature prefers-reduced-motion: reduce*, then reload:
  - Hero text and the join card **fade** in one after another with **no upward movement**.
  - Navigating between pages still fades the content in (~180ms).
  - Opening the mobile menu (narrow viewport, hamburger) fades in with **no zoom**; in DevTools, the dialog element's computed `--tw-enter-scale` is `1`.
  - Pressing and holding a gold button does not shrink it.
  - Hovering the Talk spotlight does not grow the play button.
  - Turn the emulation off and confirm every movement above is back (hero rises 8px, buttons press to 0.97, dialog zooms from 0.95).
- **Done when**: the global `*, *::before, *::after` rule is gone, every element listed in *Problem* has its `motion-reduce:` variant, and the feel checks pass in both modes.
