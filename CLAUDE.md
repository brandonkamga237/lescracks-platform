# LesCracks Platform
French-language tech training platform: resources, events, participations, Accompagnement 360.
Monorepo: `frontend/` React + Vite (SPA), `backend/` Spring Boot + PostgreSQL + MinIO.

## Structure
- `backend/src/main/java/com/brandonkamga/lescracks/` → **one package per business capability**. Target map (migration in progress, module by module): `account` (sign-in, credentials, admins) and `member` (profile, welcome answers) — both migrated, `newsletter`, `content` (articles + Talk), `event`, `engagement` (views, likes, comments on any target), `recognition`, `taxonomy`, `notification` (emails), `analytics`, `storage`, `seo`. Not yet moved: `resource` + `talk` (→ `content`), `community` (→ `engagement`), `mail` (→ `notification`), `stats` (→ `analytics`)
  - Every module uses the same skeleton: `api/` + `api/dto/` (HTTP), `application/` (use cases, commands), `domain/model/` + `domain/port/` (plain Java), `infra/persistence/`, `infra/<technology>/`, `infra/config/` (assembly + transactions). Rules, patterns and reuse: **`.claude/skills/design-patterns/SKILL.md`, mandatory for every backend change**
  - `shared/` → cross-cutting code only, never business rules:
    - `shared/security/` → SecurityConfig (route rules) + KeycloakRoleConverter. Local accounts and their sessions live in `account`; Keycloak only issues the Google/GitHub tokens the API verifies
    - `shared/config/` → OpenApiConfig, JacksonConfig, AppBeans; `shared/bootstrap/` → startup seeders and backfills
    - `shared/exception/` → business exceptions (carry an `ErrorCode`, no HTTP type) + `GlobalExceptionHandler`; `shared/dto/` → ApiError, PageResponse; `shared/paging/` → PageQuery, Paged; `shared/util/` → Slugs
    - `shared/config/TransactionalServices` → wraps plain-Java application services in their transaction
- `backend/src/main/resources/`
  - `application.yaml` + `application-{dev,prod,test}.yml`
  - `db/migration/` → Flyway migrations `V{n}__description.sql`
- `frontend/src/`
  - `pages/` → public routes, `pages/admin/` → back office
  - `components/{landing,cards,resources,admin,layout,common,ui}/`
  - `services/` → `api.ts` (public and authenticated calls), `adminApi.ts`, `auth.ts`
  - `contexts/` → AuthContext, ThemeContext; `hooks/` → `useXxx` hooks
  - `nginx.conf` → SEO bot routing + `/api` proxy (prod)
- `docker-compose.yml` → local dev stack (postgres, minio + backend under profile `app`)
- `docker-compose.prod.yml` → prod stack (postgres, minio, backend, frontend, Traefik), deployed by CI
- `.env.example` → shape of the production variables (no secrets)
- `.claude/skills/` → project skills: `design-patterns`, `git-workflow`, `dev-setup`, `backend-endpoint`, `db-migration`, `frontend-page`, `seo-page`

## Commands (exact)
Backend (from `backend/`):
- **Build**: `./mvnw clean package`
- **Test**: `./mvnw test`
- **Run**: `./mvnw spring-boot:run` (port 8080, profile `dev`)

Docker (from the repo root):
- **Dev dependencies (postgres + minio)**: `docker compose up -d` — no `.env` required
- **Full dev stack**: `docker compose --profile app up -d --build`

Frontend (from `frontend/`) — **pnpm only, never npm**:
- **Install**: `pnpm install`
- **Dev**: `pnpm dev` (localhost:5173, proxies `/api` → localhost:8080)
- **Typecheck**: `pnpm typecheck`
- **Lint**: `pnpm lint`
- **Build**: `pnpm build`

Before any commit or PR:
1. `cd frontend && pnpm typecheck` ✓
2. `cd frontend && pnpm lint` ✓
3. `cd backend && ./mvnw test` ✓

## Code Style
### Language (applies everywhere)
- **All code is in English**: variable, function, class, file and entity names, branches, commit messages, comments
- **French is reserved for text users read**: UI labels, page content, API error messages, email bodies

### Comments
- Bare minimum. A comment explains **why**, never **what** — if the code already says what, write no comment
- Not allowed: decorative file headers, javadoc/JSDoc generated on every method, comments paraphrasing the next line, `// end of function`, commented-out dead code
- Worth writing: a non-obvious workaround, an external constraint, a counter-intuitive decision, a known trap

### Backend
- **Architecture, SOLID and design patterns are non-negotiable**: follow `.claude/skills/design-patterns/SKILL.md` for every feature, fix and refactor, and run its checklist before committing. `ArchitectureTest` enforces the dependency rule in CI
- Dependency direction `api → application → domain ← infra`: `domain` and `application` are plain Java (no Spring, JPA, servlet, Hibernate, Micrometer); I/O goes through ports in `domain/port` implemented by adapters in `infra`; services are assembled in `infra/config`
- Another module is reached through its `application` interfaces (e.g. `UserDirectory`) or a domain event, never its ports, entities or repositories; `stats`/`analytics`, `seo` and `shared/bootstrap` read across modules until each exposes a query port
- Reuse before writing: paging, errors, slugs, publication lifecycle, CSV export, visitor keys live once in `shared`; a second copy in a module is a review blocker
- Controllers return the response record (or `ResponseEntity<XxxResponse>`); requests translate themselves into commands (`request.toRegistration()`), responses build themselves from models (`XxxResponse.of(model)`)
- Never expose a domain model or a JPA entity: always a DTO
- Errors: throw `NotFoundException` / `BadRequestException` / `ForbiddenException` / `ConflictException`; do not set the status in the controller, `GlobalExceptionHandler` does it
- DB access: **plain SQL through `JdbcClient`, no ORM**, in modules on the new skeleton; JPA remains only in modules not migrated yet. No N+1: no query in a loop, related data in one query per list, aggregates computed by PostgreSQL, indexes for every filtered or joined column (see the design-patterns skill)
- DB schema: Flyway only (`ddl-auto: validate` for the remaining JPA entities). A new entity field means a new `V{n}__...sql` migration; never edit a migration that has already been applied
- Lombok (`@Data`, `@Builder`) on DTOs and models; logging through `slf4j`
- Public vs protected endpoints are declared in `SecurityConfig`, plus `@PreAuthorize` on each admin method; roles come from the Keycloak realm: `user`, `admin`
- Text shown to users (emails, API errors) in French; everything else in English
- Tests mirror the production layout: `src/test/.../<module>/{api,application,domain,infra}/`; application tests use copying in-memory fakes for stores (`InMemoryXxxStore`) and assert on what was stored, never a global `controller`/`service`/`repository` split. Shared fixtures live in `support/`; domain fixtures stay in their feature package. The suffix picks the suite: `*Test` runs without Docker via `./mvnw test` (pure unit tests plus light slices like `@WebMvcTest`), `*IT` runs via `./mvnw verify` against real PostgreSQL through Testcontainers (extend `support/PostgresIT`)

### Frontend
- Import through the `@/...` alias (never deep relative paths)
- API calls only inside `src/services/*`: `api` for everything public and authenticated, `adminApi` for `/api/admin`. Auth rides on an HttpOnly cookie sent by `credentials: 'include'` — there is no token in JS to put in a header
- Base URL through `ENV.API_BASE_URL` (`src/config/env.ts`), never a hardcoded URL
- Tailwind for styling (no inline styles); Radix primitives live in `components/ui/`
- Typed props: `interface {ComponentName}Props`
- Pages in PascalCase under `pages/`, hooks named `useXxx` under `hooks/`
- Displayed text in French; identifiers, props and comments in English

## Workflow
### Branches
- `main` → production code. Nothing deploys on push: merging the release PR tags `vX.Y.Z` and deploys that version (GitHub Actions → Docker Hub → VPS)
- `develop` → integration. Default target for new work
- `feature/xxx`, `fix/xxx`, `docs/xxx`, `chore/xxx` → branch off `develop` with `--no-track` (`git switch -c feature/x --no-track origin/develop`), merge back through a PR
- `hotfix/xxx` → branches off `main`, production emergencies only
- Never write code directly on `main` or `develop`: create the branch before the first edit. Both are protected (PR + green CI, no force push)
- PR into `develop`: **squash merge**, so the PR title is the commit and follows the commit format. `develop` into `main`: **merge commit**, never squash
- Full rules: `CONTRIBUTING.md`. Enable the hook once per clone: `git config core.hooksPath .githooks`
- You may merge a PR into `develop` only with `scripts/git/merge-to-develop.sh <pr>` (it refuses any other base). **Never merge into `main`**: the user does it by hand. `gh pr merge` and direct pushes to `main`/`develop` are denied
- Releases: release-please (`.github/workflows/release.yml`) turns the commits merged into `main` into a release PR, then a `vX.Y.Z` tag and `CHANGELOG.md`. The commit type picks the bump (`fix` patch, `feat` minor, `!` major). Never edit `CHANGELOG.md`, `version.txt` or `.release-please-manifest.json` by hand
- CI (`.github/workflows/ci.yml`) runs on every PR: `./mvnw verify`, `pnpm typecheck`/`lint`/`build` and both Docker image builds. `deploy.yml` ships images tagged with the version; a rollback is a manual run of it with an earlier tag. Dependabot opens weekly update PRs against `develop`

### Commits
- Commit **as you go**, not in one lump at the end: a commit as soon as a coherent unit compiles and passes its checks
- One commit = one logical change. Never mix refactoring, feature work and formatting
- Format: `type(scope): description` in English, header ≤ 100 characters. Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`. Checked by `scripts/git/check-commit-msg.sh` (hook + CI)
- **Never mention Claude, AI or any generation tool**: no `Co-Authored-By: Claude` trailer, no "Generated with", no mention in the body. The author is the user, full stop
- Do not commit until `pnpm typecheck` / `./mvnw test` pass on the part that changed

### Never
- NEVER: `git push --force`, commit `.env`, hardcode MinIO keys / Keycloak admin credentials
- NEVER: edit a Flyway migration that is already merged (add `V{n+1}` instead)
- A new environment variable goes into `.env.example` AND `docker-compose.prod.yml`
- One compose file per environment, at the root: do not recreate one under `backend/` or `frontend/`
- Never rename `docker-compose.prod.yml` (the deploy workflow refers to it by name: `scp`, `pull`, `up -d`); its backend and frontend images take their tag from `IMAGE_TAG`
- Frontend dependencies: `pnpm add/remove`, then commit `pnpm-lock.yaml` (never generate a `package-lock.json`)

## Architecture
- Client-rendered SPA → nginx routes bot user-agents to `/seo/*` (HTML + JSON-LD snapshots rendered by the backend). Every new indexable public page needs its snapshot in `SeoController` and its nginx entry
- Flyway owns the schema → keeps dev and prod from drifting apart; SQL adapters are checked against it by their ITs
- Members and admins sign in locally (`account`: BCrypt hashes, JDBC sessions); Google and GitHub go through Keycloak, whose tokens the API verifies as an OAuth2 resource server and syncs into a local account
- MinIO (S3-compatible) for files and images, no application disk storage in production
- Frontend and backend ship as separate containers behind Traefik; the frontend only talks to the backend through `/api/*`

## Vocabulary
- **Accompagnement 360** = the flagship mentoring programme; an application to it is an `Application` with no `event`
- **Application** = either a 360 application or an event registration (`event != null`)
- **Participation** = someone enrolled on an event or on the 360, `IN_PROGRESS` then `COMPLETED` or `ABANDONED`
- **Attestation** = proof of a completed participation, checkable by anyone at `/attestations/{code}`
- **Resource** = a published piece of content (title, cover, category, status, schedule); today every resource is an **Article** (`articles` table: block body written in the back office), shown on the blog
- **SEO snapshot** = server-rendered HTML served to bots instead of the SPA

## Current product scope (September 2026)
- The current backend controllers and DTOs are the source of truth when older architecture notes above differ from the code.
- Do not restore removed programmes, applications, participations, attestations, articles, or SEO snapshot controllers as part of frontend work. Do not invent progress, favourites, event registration, or personalised history without backend support.
- The site has a **Blog** (`/blog`, articles only; old `/ressources` links redirect) and a **Formations** tab (`/formations`, courses coming soon: no course model or progress yet). Ebooks and videos were removed (V24). Public event detail routes use numeric IDs. Reading needs no account. CrackLab was removed (old `/cracklab` links redirect home; its tables stay in the database, unused); no navigation entry carries a gold highlight. Marketing copy avoids "gratuit" and any mention of French or francophone.
- Preserve the black, anthracite, white and gold palette (`#d4af37`). Visitor, member and administrator experiences must use a coherent shared session and actual backend data.
- Local member/admin authentication uses backend sessions; existing OIDC authentication is a separate transport. Do not send a stale OIDC bearer token alongside local cookie authentication.
- Validate frontend changes with `pnpm typecheck`, `pnpm lint`, and `pnpm build`. Browser checks using API fixtures verify UI behaviour, not live backend integration.
