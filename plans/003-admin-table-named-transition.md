# 003 — Name the transitioned properties on admin list rows

- **Status**: DONE
- **Commit**: 139d15a
- **Severity**: LOW
- **Category**: Performance
- **Estimated scope**: 1 file, 1 line

## Problem

`AdminRow` — the row every back-office list is made of — uses `transition-all`, so every property that ever changes on it (padding, size, layout on wrap, colours) is animated, not just the two hover changes it was written for. `transition: all` animates unintended properties off the compositor and makes later layout changes ease in instead of snapping.

```tsx
// frontend/src/components/admin/AdminTable.tsx:71 — current, inside `export function AdminRow`
<div className="mb-4 flex flex-wrap items-center gap-4 rounded-3xl border border-white/[0.06] bg-card p-6 transition-all hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20">
```

## Target

Only the border colour and the shadow transition, at 200ms with the default hover curve (Tailwind's default `transition-timing-function`, used by every other `transition-colors` in the repo):

```tsx
<div className="mb-4 flex flex-wrap items-center gap-4 rounded-3xl border border-white/[0.06] bg-card p-6 transition-[border-color,box-shadow] duration-200 hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20">
```

## Repo conventions to follow

- Name transitioned properties with Tailwind's arbitrary `transition-[…]` syntax. Exemplar: `frontend/src/index.css` `.btn-primary` → `transition-[background-color,transform] duration-150 ease-out`.

## Steps

1. **`frontend/src/components/admin/AdminTable.tsx:71`** — replace `transition-all` with `transition-[border-color,box-shadow] duration-200`. Nothing else on the line changes.

## Boundaries

- Do NOT touch the radius, colours or other admin files (the admin's `rounded-3xl` is a separate design-consistency topic).
- If line 71 does not match the quoted code (drift since commit `139d15a`), STOP and report.

## Verification

- **Mechanical** (from `frontend/`): `pnpm typecheck`, `pnpm lint` (0 errors), `pnpm build` succeed. `grep -rn "transition-all" src` returns nothing.
- **Feel check**: sign in as an admin, open `/admin/ressources` (rows rendered by `AdminRow`), hover a row: the border brightens and the shadow appears smoothly in ~200ms, exactly as before. Resize the window so a row's content wraps: the row resizes instantly, with no easing on its size.
- **Done when**: the line uses the named transition and hover still looks identical.
