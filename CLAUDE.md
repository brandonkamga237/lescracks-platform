# LesCracks Platform
French-language tech training platform: resources, events, learners, Accompagnement 360.
Monorepo: `frontend/` React + Vite (SPA), `backend/` Spring Boot + PostgreSQL + MinIO.

## Structure
- `backend/src/main/java/com/brandonkamga/lescracks/`
  - `controller/` → REST under `/api/*` (plus `SeoController` under `/seo`, outside `/api`)
  - `service/interfaces/` + `service/impl/` → all business logic (interface + Impl)
  - `domain/` → JPA entities and enums
  - `dto/` → exposed payloads (never entities)
  - `repository/` → Spring Data JPA
  - `security/jwt/`, `security/oauth/` → JWT filter, OAuth2 handlers (GitHub, Google)
  - `config/` → SecurityConfig, DataInitializer (seeds roles/types), OpenApiConfig
  - `exception/` → business exceptions + `GlobalExceptionHandler`
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
- `.claude/skills/` → project skills: `git-workflow`, `dev-setup`, `backend-endpoint`, `db-migration`, `frontend-page`, `seo-page`

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
- One service = interface in `service/interfaces/` + `XxxServiceImpl` class in `service/impl/`
- Controllers return `ResponseEntity<ApiResponse<T>>` built with `ApiResponse.success(...)` / `.error(...)`
- Never expose a `domain/` entity: always a DTO
- Errors: throw `ResourceNotFoundException` / `BadRequestException` / `ForbiddenException`; do not set the status in the controller, `GlobalExceptionHandler` does it
- DB schema: Flyway only (`ddl-auto: validate` everywhere). A new entity field means a new `V{n}__...sql` migration; never edit a migration that has already been applied
- Lombok (`@Data`, `@Builder`) on DTOs and entities; logging through `slf4j`
- Public vs protected endpoints are declared in `SecurityConfig`; roles: `user`, `learner`, `admin`
- Text shown to users (emails, API errors) in French; everything else in English

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
- `main` → production. Every push triggers a deployment (GitHub Actions → Docker Hub → VPS)
- `develop` → integration. Default target for new work
- `feature/xxx`, `fix/xxx`, `docs/xxx` → branch off `develop`, merge back through a PR
- `hotfix/xxx` → branches off `main`, production emergencies only
- Never write code directly on `main` or `develop`: create the branch before the first edit

### Commits
- Commit **as you go**, not in one lump at the end: a commit as soon as a coherent unit compiles and passes its checks
- One commit = one logical change. Never mix refactoring, feature work and formatting
- Format: `type(scope): description` in English (`feat`, `fix`, `refactor`, `docs`, `chore`, `test`)
- **Never mention Claude, AI or any generation tool**: no `Co-Authored-By: Claude` trailer, no "Generated with", no mention in the body. The author is the user, full stop
- Do not commit until `pnpm typecheck` / `./mvnw test` pass on the part that changed

### Never
- NEVER: `git push --force`, commit `.env`, hardcode JWT_SECRET / MinIO keys / OAuth secrets
- NEVER: edit a Flyway migration that is already merged (add `V{n+1}` instead)
- A new environment variable goes into `.env.example` AND `docker-compose.prod.yml`
- One compose file per environment, at the root: do not recreate one under `backend/` or `frontend/`
- Never rename `docker-compose.prod.yml` (CI refers to it by name: `paths` filter, `scp`, `up -d`)
- Frontend dependencies: `pnpm add/remove`, then commit `pnpm-lock.yaml` (never generate a `package-lock.json`)

## Architecture
- Client-rendered SPA → nginx routes bot user-agents to `/seo/*` (HTML + JSON-LD snapshots rendered by the backend). Every new indexable public page needs its snapshot in `SeoController` and its nginx entry
- Flyway owns the schema (Hibernate only validates) → keeps dev and prod from drifting apart
- Stateless JWT + OAuth2 (GitHub, Google) → no server-side session
- MinIO (S3-compatible) for files and images, no application disk storage in production
- Frontend and backend ship as separate containers behind Traefik; the frontend only talks to the backend through `/api/*`

## Vocabulary
- **Accompagnement 360** = the flagship mentoring programme; an application to it is an `Application` with no `event`
- **Application** = either a 360 application or an event registration (`event != null`)
- **Learner / Apprenant** = public profile of a participant (page `/apprenants/{slug}`)
- **Resource** = content (VIDEO/DOCUMENT/ARTICLE). A video is always `EXTERNAL`, a document is `UPLOADED` to MinIO, an article is `INLINE` and written in the back office
- **SEO snapshot** = server-rendered HTML served to bots instead of the SPA
