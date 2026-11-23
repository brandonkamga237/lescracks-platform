---
paths:
  - "frontend/**"
---

# Frontend conventions

- Import through the `@/` alias, never `../../`
- Every API call goes through `src/services/`: `api.ts` for public and member endpoints,
  `adminApi.ts` for the back office. Components never call `fetch`
- `services/http.ts` is the only fetch wrapper. It sends either the session cookie
  (`credentials: 'include'`, local sign-in) or an OIDC bearer token (Google/GitHub members),
  never both
- The API base comes from `ENV.API_BASE_URL` (`src/config/env.ts`); never hardcode a URL
- Tailwind only; no inline style unless the value is computed at runtime. Radix primitives live
  in `components/ui/`
- Props are typed with `interface XxxProps`
- Pages are PascalCase files under `pages/` and are loaded with `React.lazy` in `App.tsx`;
  hooks are `useXxx` under `hooks/`; pure helpers go to `lib/`
- Session state comes from `useSession()`; do not read auth state any other way
- Text on screen is in French; identifiers, props and comments are in English
- Validate with `pnpm typecheck && pnpm lint && pnpm build`. A browser check against API
  fixtures proves the UI, not the integration with the live backend

## Redesigned pages (landing first, then the rest of the site)

- Compose pages from shared layers, never from page-local copies:
  - `components/ui/`: design primitives without domain knowledge, variants with `cva`
    (`Button`, `Badge`, `ArrowCircle`, `ListRow`, `Band`, `SectionHeading`, `Accordion`…)
  - `components/motion/`: motion behaviours (`Reveal`, `SplitText`, `Stagger`, `Parallax`,
    `ScaleInSection`, `Marquee`, `Magnetic`); each honours reduced motion itself
  - `components/site/`: the public site chrome (`SiteHeader`, `SiteFooter`, phone menu)
  - domain pieces in their area (`events/EventRow`, `blog/ArticleRow`, `newsletter/`,
    `recognition/CertificateLookup`); `components/landing/` only holds landing sections
- Links, social accounts and the platform spaces live in `config/site.ts`; never hardcode the
  community URL or a space's route in a component
- Behaviour shared by several components is a hook (`useNewsletter`, `useScrolledPast`,
  `useActiveSection`, `useScrollLock`, `useClock`); formatting and rules are `lib/` helpers
- Colours and sizes come from the theme (`ivory`, `noir-*`, `text-display`, `ease-out`), not
  from arbitrary values
