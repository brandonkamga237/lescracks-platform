---
name: frontend-page
description: Create or change a page or component in the LesCracks frontend (React + Vite + Tailwind), following the routing, services layer and project conventions. Use for any new page, route or admin screen.
---

# Adding a page

## Where things go

- Public page → `src/pages/Xxx.tsx` (PascalCase)
- Admin page → `src/pages/admin/AdminXxx.tsx`, rendered inside `AdminLayout`
- Reusable component → `src/components/{landing,cards,resources,admin,layout,common}/`
- UI primitive (Radix + Tailwind) → `src/components/ui/`
- Hook → `src/hooks/useXxx.ts`

The route is declared in `src/App.tsx` (import plus `<Route>`). Admin pages sit under
the admin layout and are guarded client-side by the `AdminRoute` wrapper in `App.tsx`,
which reads `isAdmin` from `useAuth()`.

## Non-negotiable conventions

- **Import through the `@/` alias** — never `../../..`.
- **No `fetch` inside a component.** Every API call goes through `src/services/`:
  - `api.ts` → public and authenticated endpoints alike
  - `adminApi.ts` → `/api/admin` endpoints
  Both send the session cookie through `credentials: 'include'`; no token is handled in
  JavaScript.
  Add the method to the service with its exported TypeScript type, then call it from
  the page.
- **Never hardcode an API URL**: the base comes from `ENV.API_BASE_URL`
  (`src/config/env.ts`), which the services already use.
- **Tailwind only**, no inline styles and no ad-hoc CSS.
- **Typed props**: `interface XxxProps { ... }`.
- **Displayed text in French** (the site is francophone); identifiers, props and
  comments in English.
- Light and dark themes through `ThemeContext`: use `dark:` variants rather than a
  fixed colour.
- Auth state through `useAuth()` (`AuthContext`), never by reading the token directly.

## SEO — required on a public page

Mount the `SEO` component (`@/components/common/SEO`) at the top of the page:
```tsx
<SEO title="Page title" description="…" url="/my-page" />
```
It updates `document.title` and the meta and OG tags already present in `index.html`.

**An indexable public page does not stop there**: the site is a SPA, so crawlers
without JavaScript see nothing. It also needs a server snapshot → see the `seo-page`
skill.

## Verify
```
cd frontend && pnpm typecheck && pnpm lint
```
`pnpm` only, never `npm` (the project lockfile is `pnpm-lock.yaml`).
