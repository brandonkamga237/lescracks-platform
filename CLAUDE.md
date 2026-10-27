# LesCracks Platform

Tech learning platform: a blog, events and hackathons (registrations, team projects), the
LesCracks Talk, member profiles with badges and certificates, a newsletter, and a back office.
Monorepo: `backend/` (Spring Boot 3, Java 21, PostgreSQL, MinIO) and `frontend/` (React SPA,
Vite, TypeScript, Tailwind). The architecture, with diagrams, is in `docs/architecture/README.md`;
the full database schema is in `docs/architecture/database.md`.

## Layout

- `backend/src/main/java/com/brandonkamga/lescracks/<module>/`: one package per business
  capability (`account`, `member`, `newsletter`, `taxonomy`, `content`, `event`, `engagement`,
  `recognition`, plus `community`, `stats`, `mail`, `seo`, `storage` not yet on the module
  skeleton). `shared/` holds cross-cutting code only
- `backend/src/main/resources/db/migration/`: Flyway migrations `V{n}__description.sql`
- `frontend/src/`: `pages/` (public), `pages/admin/` (back office), `components/`, `services/`
  (every API call), `hooks/`, `contexts/`, `lib/` (pure helpers)
- `frontend/nginx.conf`: SPA, `/api` proxy, SEO bot routing
- `docker-compose.yml` (dev), `docker-compose.prod.yml` (prod, deployed by CI), `.env.example`
- `docs/architecture/`: architecture, design audit, database schema

## Commands

| Where | Command | What |
| --- | --- | --- |
| root | `docker compose up -d` | PostgreSQL + MinIO for development, no `.env` needed |
| `backend/` | `./mvnw spring-boot:run` | API on :8080, profile `dev` |
| `backend/` | `./mvnw test` | unit tests and `@WebMvcTest` slices, no Docker |
| `backend/` | `./mvnw verify` | also the `*IT` suite on PostgreSQL via Testcontainers (Docker) |
| `frontend/` | `pnpm install`, `pnpm dev` | SPA on :5173, proxies `/api` to :8080 |
| `frontend/` | `pnpm typecheck`, `pnpm lint`, `pnpm build` | the checks CI runs |

Use `pnpm`, never `npm`. Before a commit, the checks of the area you touched must pass:
`./mvnw test` for the backend, `pnpm typecheck && pnpm lint` for the frontend.

## Rules that apply everywhere

- Code, identifiers, file names, branches, commits and comments are in English. French is only
  for what users read: UI text, page content, API error messages, emails
- Marketing copy never says "gratuit" and never mentions French or francophone audiences
- Comments explain why, never what. No file headers, no generated javadoc, no commented-out code
- Keep the black, anthracite, white and gold (`#d4af37`) palette
- The current controllers, DTOs and migrations are the truth; when a document disagrees, the
  code wins and the document gets fixed
- Backend, frontend and infrastructure conventions load from `.claude/rules/` when you work in
  those files

## Git workflow

- Never edit on `main` or `develop`: branch first, off `develop`, without tracking it:
  `git switch -c feature/x --no-track origin/develop` (`fix/`, `docs/`, `chore/` likewise;
  `hotfix/` branches off `main`)
- Commit as you go, one logical change per commit, header `type(scope): description` (≤ 100
  characters; types `feat fix perf refactor docs test build ci chore style revert`), checked by
  `scripts/git/check-commit-msg.sh`
- Never mention Claude, AI or a generation tool in a commit, PR title or PR body
- PRs target `develop` and are squash-merged with `scripts/git/merge-to-develop.sh <pr>` once
  CI is green. Only the maintainer merges into `main` (merge commit, then the release PR)
- Releases are cut by release-please from the commit types (`fix` patch, `feat` minor, `!`
  major). Never edit `CHANGELOG.md`, `version.txt` or `.release-please-manifest.json`
- The step-by-step lives in the `git-workflow` skill; the full policy in `CONTRIBUTING.md`

## Never

- `git push --force`, committing `.env`, hardcoding MinIO keys or Keycloak admin credentials
- Editing a Flyway migration that is already merged: add the next `V{n}` instead
- Restoring removed features: the Accompagnement 360 programme, applications, participations,
  ebooks, videos (removed in V24) and CrackLab (dropped in V41; old `/cracklab` links redirect home)
- Inventing data the backend does not provide (progress, favourites, personalised history)

## Vocabulary

- **Article**: a blog post in the `articles` table (module `content`); the API and the
  frontend still call it a "resource" (`/api/resources`)
- **Talk**: an episode of the LesCracks Talk, a YouTube video (`talk_videos`)
- **Registration**: a member signed up for an event; **submission**: a hackathon team project
- **Certificate**: proof of participation in an event, checkable by anyone at
  `/attestations/{code}`; **badge**: a distinction awarded to a member
- **Formations**: the courses tab, "coming soon": there is no course model yet
- **SEO snapshot**: server-rendered HTML that nginx serves to crawlers instead of the SPA

## Where to look

- Skills (`.claude/skills/`): `design-patterns` (backend architecture, mandatory for backend
  changes), `backend-endpoint`, `db-migration`, `frontend-page`, `seo-page`, `dev-setup`,
  `git-workflow`, plus UI and motion skills
- Subagents (`.claude/agents/`): `architecture-reviewer` checks a branch against the backend
  rules before a PR; `release-verifier` checks production after a deployment
