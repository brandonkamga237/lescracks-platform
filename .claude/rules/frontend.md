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

## Three places, three frames

- **The landing** (`/` for a visitor): a showcase. `SiteHeader` and `SiteFooter` only link to
  the landing's own sections; the platform is entered through its calls to action
- **The platform** (every other public or member page): one layout route, `SiteShell`, around
  all of them in `App.tsx`. The sidebar and the phone bars stay put, only the content changes.
  A member gets Dashboard (`/`), the spaces and their account; a visitor gets the spaces and
  a way to join. Pages render their content only, never a frame of their own
- **The airlock** (sign-in, sign-up, password reset, welcome, links opened from an email):
  `AuthShell`, without any menu
- The back office keeps `AdminLayout`

## Building pages

- Compose pages from shared layers, never from page-local copies:
  - `components/ui/`: design primitives without domain knowledge, variants with `cva`
    (`Button`, `Badge`, `ArrowCircle`, `ListRow`, `Band`, `SectionHeading`, `SpaceHeader`,
    `TextField`, `SearchField`, `PillTabs`, `Pager`, `CardRail`, `CategoryChip`, `EmptyPanel`…)
  - `components/motion/`: motion behaviours (`Reveal`, `SplitText`, `Stagger`, `Parallax`,
    `ScaleInSection`, `Marquee`, `Magnetic`); each honours reduced motion itself
  - `components/site/`: the frames (`SiteShell`, `AuthShell`) and the landing chrome
  - `components/space/`: the platform's sidebar, phone bars and tabs
  - domain pieces in their area (`events/EventRow`, `blog/ArticleRow`, `member/`,
    `recognition/CertificateLookup`); `components/landing/` only holds landing sections
- Inside the platform, design for the phone first: compact page headers, cards that turn into
  rows on a phone (`ArticleCard compactOnPhone`), filters in a bottom sheet rather than a row
  that hides most of them, a sticky search, and data keyed in `useApi` so a page comes back at once
- The site installs as an app (PWA): `public/site.webmanifest`, and `public/sw.js`, which only
  answers failed page loads with `offline.html` and must never cache the bundles. Phones still in
  the browser are invited to install by `components/install/` (`InstallAppBanner`, `InstallGuide`):
  `lib/installPlatform.ts` picks the gesture (Android prompt or menu, iOS Safari or another iOS
  browser, in-app browser), `lib/installPrompt.ts` keeps Chrome's prompt, `useInstallNudge` decides
  when (second page of a visit, once per visit, two weeks after "Plus tard", members before visitors)
- Links, social accounts and the platform spaces live in `config/site.ts`; never hardcode the
  community URL or a space's route in a component
- Behaviour shared by several components is a hook (`useNewsletter`, `useScrolledPast`,
  `useActiveSection`, `useScrollLock`, `useClock`); formatting and rules are `lib/` helpers
- Colours and sizes come from the theme (`ivory`, `noir-*`, `text-display`, `ease-out`), not
  from arbitrary values
