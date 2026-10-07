# 002 — Mobile menu opens from its trigger, not from above the screen

- **Status**: DONE
- **Commit**: 139d15a
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 2 files, ~20 lines

## Problem

The mobile menu is a Radix `Dialog` pinned to the top of the screen, but it inherits the animation written for the *centered* modal. That animation starts the panel at `translateY(-50%)` of its own height and slides it down — so a ~500px menu falls ~250px from above the viewport in 200ms, while its trigger (the hamburger button) sits in the top-right corner of the header. The motion says "this came from the sky", not "this came from the button you tapped".

```tsx
// frontend/src/components/ui/dialog.tsx:39 — current DialogContent classes (shared by every dialog)
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2 sm:rounded-lg",
```

```tsx
// frontend/src/components/layout/Header.tsx:119 — the trigger, top-right of the header
<button type="button" className="ml-auto flex h-10 w-10 items-center justify-center rounded border border-line text-t1 transition-colors hover:bg-noir-800 lg:hidden" aria-label="Ouvrir le menu">…</button>
// frontend/src/components/layout/Header.tsx:121 — the menu re-pins the dialog to the top
<DialogContent className="mode-raised top-2 w-[calc(100%_-_1rem)] translate-y-0 rounded-lg border-line bg-card p-4 sm:top-4 sm:w-[calc(100%_-_2rem)] sm:p-6">
```

Why it can't be fixed from `Header.tsx` alone: tailwindcss-animate's `enter`/`exit` keyframes animate `transform: translate3d(var(--tw-enter-translate-x), var(--tw-enter-translate-y), 0) scale3d(var(--tw-enter-scale), …)` toward the element's own transform. The `slide-in-from-top-1/2` class sets `--tw-enter-translate-y: -50%`, and `tailwind-merge` (used by `cn`) does not know these plugin classes, so passing a competing `slide-in-from-top-*` from `Header.tsx` leaves both classes in place with an unreliable winner.

## Target

`DialogContent` takes a `position` prop:

- `position="center"` (default) — exactly today's behaviour: centered, fade + zoom 0.95, translate variables matching the centering (`left-1/2`, `top-1/2`) so there is no drift. The verification dialog in `frontend/src/pages/AuthPage.tsx:224` uses this and must not change.
- `position="top"` — pinned 0.5rem (1rem from `sm`) under the top edge, horizontally centered. Animation: fade + zoom from **0.95**, **origin top-right** (where the trigger is), **no vertical slide**, `200ms` with the repo's `ease-out` (= `var(--ease-out)` = `cubic-bezier(0.23, 1, 0.32, 1)`). Only the horizontal translate variable is kept (`slide-*-left-1/2`), because it must equal the `translate-x-[-50%]` centering or the panel would shift sideways during the animation.

## Repo conventions to follow

- `frontend/src/components/ui/` holds Radix wrappers built with `cn` from `@/lib/utils`; keep the forwardRef shape and `displayName` already used in `dialog.tsx`.
- `ease-out` in this repo already resolves to `cubic-bezier(0.23, 1, 0.32, 1)` (override in `frontend/tailwind.config.js`, `transitionTimingFunction.out`), and tailwindcss-animate maps `duration-*` / `ease-*` onto the animation too. Do not add new curves.
- Code and comments in English; comments only for the *why*.

## Steps

1. **`frontend/src/components/ui/dialog.tsx`** — above `const DialogContent`, add:

   ```tsx
   // The translate variables must equal the centering transform, or the panel drifts while it animates.
   const DIALOG_POSITION = {
     center:
       "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2",
     // Pinned under the header: grows from the top-right corner, where the menu trigger sits.
     top:
       "left-[50%] top-2 translate-x-[-50%] origin-top-right sm:top-4 data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2",
   } as const
   ```

2. **Same file, `DialogContent`** — change the props type and destructuring, and split the class string:

   ```tsx
   const DialogContent = React.forwardRef<
     React.ElementRef<typeof DialogPrimitive.Content>,
     React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { position?: keyof typeof DIALOG_POSITION }
   >(({ className, children, position = "center", ...props }, ref) => (
     <DialogPortal>
       <DialogOverlay />
       <DialogPrimitive.Content
         ref={ref}
         className={cn(
           "fixed z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
           DIALOG_POSITION[position],
           className
         )}
         {...props}
       >
   ```

   Leave the children, the close button and `displayName` exactly as they are.

3. **`frontend/src/components/layout/Header.tsx:121`** — replace the opening tag with (removed: `top-2`, `translate-y-0`, `sm:top-4`; added: `position="top"`):

   ```tsx
   <DialogContent position="top" className="mode-raised w-[calc(100%_-_1rem)] rounded-lg border-line bg-card p-4 sm:w-[calc(100%_-_2rem)] sm:p-6">
   ```

## Boundaries

- Do NOT touch `frontend/src/pages/AuthPage.tsx`; it must keep the default centered behaviour.
- Do NOT change the overlay, durations, the close button, or any menu content.
- Do NOT add dependencies.
- If `dialog.tsx:39` or `Header.tsx:121` no longer match the quoted code (drift since commit `139d15a`), STOP and report.

## Verification

- **Mechanical** (from `frontend/`): `pnpm typecheck` → no errors; `pnpm lint` → 0 errors (6 pre-existing warnings are fine); `pnpm build` → succeeds.
- **Feel check**: `pnpm dev`, open http://localhost:5173 with the viewport at 390px wide (DevTools device toolbar), tap the hamburger:
  - The menu appears in place under the header, growing slightly out of the **top-right corner**; it never travels down from above the screen.
  - Closing it shrinks back toward the top-right corner and fades.
  - DevTools → *Animations* panel at 10% speed: no vertical travel at all, and no horizontal shift (the panel's left edge stays put while it scales).
  - At 700px wide (sm, below lg) the panel is still centered and pinned 1rem from the top.
  - Register a new account on `/inscription` (or trigger the "Vérifie ta boîte de réception" dialog in `AuthPage.tsx`): that dialog still opens **centered**, fading and zooming in place.
- **Done when**: `DialogContent` accepts `position`, the menu uses `position="top"` with origin top-right and no vertical slide, and the centered dialog is visually unchanged.
