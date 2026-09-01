# LesCracks — Frontend

React SPA for the LesCracks platform, served by Nginx in production.

Stack: React, TypeScript, Vite, Tailwind CSS, Radix UI, React Router, Framer Motion,
GSAP, Recharts. `package.json` is the source of truth for versions.

## Running it

**pnpm only** — the project lockfile is `pnpm-lock.yaml`.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm typecheck    # tsc -b
pnpm lint         # eslint
pnpm build        # output in dist/
```

The API must be running on `localhost:8080`: Vite proxies `/api`, `/oauth2` and
`/login/oauth2` to the backend, so no environment variable is needed in development.

## Layout

```
src/
├── pages/          public pages; pages/admin/ for the back office
├── components/
│   ├── ui/         Radix + Tailwind primitives
│   ├── layout/     layouts, including AdminLayout
│   ├── landing/    landing page sections
│   ├── cards/      reusable cards
│   ├── resources/  resource rendering
│   ├── admin/      back office components
│   ├── common/     cross-cutting, including SEO
│   └── icons/
├── services/       api.ts, adminApi.ts, auth.ts
├── contexts/       AuthContext, ThemeContext
├── hooks/          useXxx
├── config/env.ts   reads the Vite variables
├── lib/            helpers
├── data/           static content
└── utils/
```

## Conventions

- **Import through the `@/` alias** — never deep relative paths.
- **No `fetch` inside a component.** Every API call goes through `src/services/`:
  - `api.ts` — public and authenticated endpoints alike
  - `adminApi.ts` — `/api/admin` endpoints

  Both send the session cookie via `credentials: 'include'`, so no token is handled in
  JavaScript.
- **No hardcoded API URL**: the base comes from `ENV.API_BASE_URL` (`src/config/env.ts`).
- Tailwind for styling, no inline styles. Light and dark themes through
  `ThemeContext` and the `dark:` variants.
- Typed props: `interface {ComponentName}Props`.
- Pages in PascalCase, hooks named `useXxx`.
- Code, identifiers and comments in English; only displayed text is in French.

## SEO

Every public page mounts the `SEO` component:

```tsx
import SEO from '@/components/common/SEO';

<SEO title="Title" description="…" url="/my-page" />
```

Since the site is rendered client-side, crawlers that do not run JavaScript see
nothing. `nginx.conf` detects bot user-agents and routes them to HTML snapshots
rendered by the backend, while humans get the SPA.

Adding an indexable public page therefore also means an entry in the `$seo_page` map
of `nginx.conf`, a renderer in `SeoController` and a URL in `SitemapController` on
the backend side.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base path for API calls |

The default is enough in both development and production: the Vite proxy on one
side and Nginx on the other serve the API from the same origin.

## Build and production

`pnpm build` produces `dist/`. The `Dockerfile` builds the image and serves the
result with Nginx, applying `nginx.conf` (SPA routing, `/api` proxy, bot routing to
the SEO snapshots). TLS, the domain and the `www` to apex redirect are handled
upstream by Traefik, through the labels in `docker-compose.prod.yml`.
