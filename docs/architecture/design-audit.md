# Design audit — 26 October 2026

A measured review of the whole platform against the design rules the project set itself
([design-patterns skill](../../.claude/skills/design-patterns/SKILL.md)) and the usual quality
criteria: modularity, coupling, layering, SOLID, reuse, persistence and performance, tests,
security, operability, delivery, documentation. The system it describes is drawn in
[README.md](README.md).

This file is a snapshot. Re-run the measurements (commands at the end) rather than trusting
the numbers after a few releases.

## Verdict

The suspicion that the project is "very bad technically" does **not** hold for its core. The
eight modules already on the target skeleton are well designed: inward dependencies checked in
CI, plain SQL with no N+1, batched loading, side effects after commit, copying fakes in tests,
an integration test for every SQL adapter. The weak points are elsewhere:

1. **Security defaults** that could open the back office (fixed on this branch, two actions remain on the server).
2. **Five modules not migrated yet** (`stats`, `seo`, `mail`, `community`, partly `storage`), where the rules are not met and not checked.
3. **Documentation that had drifted from the code** (Hibernate that no longer exists, a mentoring programme that was removed, comments claiming the API had no session cookie).
4. **No automated test at all on the frontend.**

## Scorecard

0 = absent, 3 = acceptable, 5 = exemplary. "After" is the state of this branch.

| Criterion | Before | After | Evidence |
| --- | :---: | :---: | --- |
| Modularity and cohesion | 4 | 4 | 14 packages, one capability each; each table owned by one module |
| Coupling and dependency direction | 3.5 | 4.5 | module graph acyclic, now enforced; `shared` no longer imports a module's `infra` |
| Layering (ports and adapters) | 3 | 3.5 | 8 of 13 business modules on the skeleton and checked; `stats` core imports Spring, its HTTP DTOs and an HTTP client |
| SOLID | 3.5 | 3.5 | 4 services over 150 lines, 3 with more than 5 collaborators (see R8) |
| Reuse (no duplicated kernel code) | 4 | 4 | paging, errors, slugs, CSV, visitor keys, scheduling each exist once |
| Persistence and performance | 3.5 | 4 | no query in a loop found; 3 missing indexes added (V40); JPA removed; first JS bundle −33 % |
| Backend tests | 4 | 4 | 251 unit tests + 12 Testcontainers ITs; all 26 SQL adapters covered through their ports |
| Frontend tests | 0 | 0 | no test runner, no test file |
| Security | 2 | 3.5 | admin/admin bootstrap and Grafana fallback removed; CSRF protection documented and asserted; two server actions pending (R1, R2) |
| Operability and observability | 4 | 4 | metrics, logs, probes, alerts, health on a private port |
| Delivery (CI/CD) | 4.5 | 4.5 | PR gate (verify, lint, build, images, commit format), tagged releases, one-command rollback |
| Documentation accuracy | 2 | 4 | architecture with diagrams added; stale Hibernate, migration and auth notes corrected |

## Measurements

| Metric | Value |
| --- | --- |
| Backend production code | 415 Java files, ~16 200 lines, 14 top-level packages |
| Backend tests | 82 files: 251 unit tests (`./mvnw test`), 12 integration tests (`./mvnw verify`) |
| Modules checked by `ArchitectureTest` | account, member, newsletter, engagement, taxonomy, content, event, recognition |
| Largest classes | `StatsServiceImpl` 428 lines (8 collaborators), `SeoController` 426, `JdbcArticleStore` 220, `SeoHtml` 209 |
| Application services > 150 lines | `CommentServiceImpl` 185, `BadgeServiceImpl` 163, `CertificateServiceImpl` 158, `SubmissionServiceImpl` 154 |
| Services with > 5 collaborators | `StatsServiceImpl` 8, `ArticleAdminServiceImpl` 8, `CertificateServiceImpl` 7, `MemberActivityServiceImpl` 6 |
| Cross-module dependency cycles | 0 |
| Schema | 40 Flyway migrations, 27 live tables + 6 unused `cracklab_*` |
| Frontend | 132 TS/TSX files, ~13 400 lines; 0 `any`; 0 `fetch` outside `services/`; 0 deep relative imports; 4 inline styles |
| Frontend lint | 0 errors, 39 warnings (see R10) |
| First JS bundle | 859 kB → 575 kB (177 kB gzip) |

## Fixed on this branch

| # | Severity | Finding | Fix |
| --- | --- | --- | --- |
| F1 | Critical | `AdminBootstrap` re-created `ADMIN_USERNAME` on every boot when that name was missing, with `admin`/`admin` as fallback in **production** — a working back-office login whenever the variables were absent, even next to real admins | Creates only the first admin of an empty back office and refuses to start without a password; unit-tested |
| F2 | High | Grafana is public (`grafana.lescracks.com`) and its compose entry fell back to `admin`/`admin` | The variable is now required (`${…:?}`) |
| F3 | Medium | `spring-boot-starter-data-jpa` still on the classpath with no entity: Hibernate booted for nothing, `SPRING_DDL_AUTO` and `ddl-auto: validate` suggested a schema check that no longer existed | Replaced by `spring-boot-starter-jdbc`; dead settings, variable and logging removed |
| F4 | Medium | `shared/security` imported `account.infra` (a kernel depending on a module's adapter), with an exemption in `ArchitectureTest` | `AuthenticatedRequestFilter` contract in `shared`; the filter is also kept out of the plain servlet chain; new rule: `shared` never reaches a module's `infra` or `api` |
| F5 | Medium | `event_submission_members` was filtered by `user_id` with no usable index; `event_submissions.owner_id` and `comment_reports.reporter_id` foreign keys unindexed (cascade deletes scan) | V40 adds the three indexes |
| F6 | Medium | Comments stated "no cookie, no session" and "the API is stateless" next to `csrf.disable()`, while local members sign in with a session cookie | The real protection (SameSite=Lax + CORS rejecting foreign origins, subdomains included) is documented and asserted by two tests |
| F7 | Medium | Every public page was in the first bundle, code highlighter included | Public pages load on demand |
| F8 | Low | Stale docs: `db-migration` skill (baseline, `DataInitializer`, JPA entities), `dev-setup`, backend README, `CLAUDE.md`, root README | Rewritten to match the code |
| F9 | Low | Frontend dependencies `path` (browser polyfill, unused) and `@types/react-router-dom` v5 (conflicts with v7's own types); orphan JSDoc in `http.ts` | Removed |
| F10 | — | Module acyclicity was true but unchecked | `ArchitectureTest.modulesHaveNoCycles` |

## Remaining work, by priority

### To do on the server (cannot be fixed from the repository)

- **R1 — High.** Grafana only reads `GF_SECURITY_ADMIN_PASSWORD` when its volume is first created.
  If it was ever started without the variable, the account is still `admin`/`admin`: try it, and
  if it opens, run `docker exec lescracks-grafana grafana-cli admin reset-admin-password <new>`.
  Likewise, check the `admins` table for an `admin` row nobody created on purpose
  (`SELECT id, username, created_at FROM admins;`) and delete it from the back office.
- **R2 — High.** `application-prod.yml` sets `flyway.validate-on-migrate: false`, so an edited
  migration would go unnoticed in production. Before removing that line, run a validation
  against production (`flyway validate`, or start the new image once against a copy of the
  database) to learn whether a checksum already differs.

### Architecture

- **R3 — Medium. `stats` → `analytics`.** `StatsServiceImpl` lives in `domain/` but is a Spring
  `@Service` that builds its own HTTP DTOs and calls `UmamiClient` directly. Target: read models
  in `application/`, an `AudienceGateway` port implemented by the Umami client in
  `infra/umami/`, assembly in `infra/config/`, responses built in `api/dto` with `of(...)`; then
  add the module to `ArchitectureTest`. Split the service by dashboard (overview, growth,
  audience, conversions) to fall under 150 lines and 5 collaborators each.
- **R4 — Medium. `seo`.** `SeoController` holds 426 lines of page composition and JSON-LD. Move
  the composition into an application service returning a `Snapshot` model; the controller only
  renders it. That also makes it unit-testable without MockMvc.
- **R5 — Medium. `mail` → `notification`.** `Mailer` (a port) and the email records sit in
  `mail/domain`, used by five modules; templates and SMTP in `mail/infra`. Mostly a move to the
  skeleton (`domain/port/Mailer`, `domain/model/*Email`, `infra/smtp`, `infra/template`).
- **R6 — Low. `community`.** A read-side composition of four modules with no domain of its own.
  Acceptable as is; give it the skeleton (`application` + `api` + `infra/config`) and add it to
  `ArchitectureTest`.
- **R7 — Low. HTTP contracts shared across modules.** `member/api/dto` reuses `account`'s
  `IdentityResponse` and `SignupContext`; `community/api/dto` reuses `recognition`'s
  `MemberBadgeResponse`. A change in one module's API silently changes another's. Each module
  should own its payloads (they are small records).
- **R8 — Low. Service size.** `CommentServiceImpl` (posting vs moderation), `ArticleAdminServiceImpl`
  (8 collaborators) and `CertificateServiceImpl` (7) each do two jobs; split by use-case family.

### Tests

- **R9 — Medium. Frontend has no tests.** Start with Vitest on what breaks silently: `lib/`
  (slugs, dates, phone, markdown, arrival), `services/http.ts` (transport choice, timeouts, error
  mapping). Then a Playwright smoke run on API fixtures: landing, blog post, sign-in, admin guard.
  Add `pnpm test` to `ci.yml`.

### Frontend quality and performance

- **R10 — Low.** 39 lint warnings from the React Compiler rules: 15 `setState` called
  synchronously in an effect (cascading renders), 6 impure calls during render, 4 ref reads
  during render, 13 files exporting both components and helpers (breaks fast refresh). Fix them
  file by file, then turn the rules back into errors.
- **R11 — Low.** The first bundle is still 575 kB: measure what remains (`framer-motion`,
  `oidc-client-ts` and the landing page are likely candidates) before optimising further.

### Infrastructure

- **R12 — Low.** `minio/minio:latest` and `umami:postgresql-v2` are floating tags: a restart can
  change the version. Pin them like the other images.
- **R13 — Low.** The API, Keycloak, Umami and postgres-exporter all connect with the same
  database superuser. Give each its own role; the exporter needs only `pg_monitor`.
- **R14 — Low.** nginx still proxies `/oauth2/` and `/login/` to the backend, which no longer has
  an OAuth2 client (it is a resource server). Confirm nothing calls them, then remove both blocks.
- **R15 — Low.** The API answers on both `lescracks.com/api` (nginx) and `api.lescracks.com`
  (Traefik). The SPA only uses the first. Two public entry points double what must be secured
  and monitored; drop the Traefik route unless something external uses it.

### Smaller notes

- `LastSeenFilter` finds the account by email, where the rules say to identify people by id.
- A newsletter broadcast renders every email inside the admin's HTTP request; past a few
  thousand subscribers, move it to a queued job.
- The "Vocabulary" section of `CLAUDE.md` still defines Accompagnement 360, Application,
  Participation and Attestation, which no longer exist in the code.

## How to measure again

```bash
# Backend: size per module, largest classes, cross-module imports
cd backend/src/main/java/com/brandonkamga/lescracks
for m in */; do echo "$m $(find $m -name '*.java' | wc -l) files"; done
find . -name '*.java' -exec wc -l {} + | sort -rn | head
grep -rhoE '^import com\.brandonkamga\.lescracks\.[a-z]+\.[a-z]+' . | sort | uniq -c | sort -rn

# Rules that must stay at zero
grep -rlE '^import (org\.springframework|jakarta\.servlet)' --include=*.java . | grep -E '/(domain|application)/'
grep -rn '@Entity\|JpaRepository' .

# Tests: unit, then integration (needs Docker)
cd backend && ./mvnw test && ./mvnw verify

# Frontend
cd frontend && pnpm typecheck && pnpm lint && pnpm build   # bundle sizes printed by the build
grep -rn 'fetch(' src | grep -v '^src/services'
```
