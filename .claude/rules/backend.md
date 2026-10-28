---
paths:
  - "backend/**"
---

# Backend conventions

The architecture, its patterns and the pre-commit checklist are in the `design-patterns` skill:
load it before any backend change. `ArchitectureTest` enforces the mechanical part in CI.

## Structure

- Each module follows `api/` + `api/dto/`, `application/`, `domain/model/` + `domain/port/`,
  `infra/persistence/`, `infra/<technology>/`, `infra/config/`
- Dependency direction `api → application → domain ← infra`. `domain` and `application` are
  plain Java: no Spring, servlet or Micrometer import
- Application services are built in `infra/config` and wrapped by `TransactionalServices`;
  methods named `find/require/list/search/count…` run read-only
- Another module is reached through its `application` interfaces or a domain event, never its
  `domain/port` or `infra`. `stats`, `seo` and `shared/bootstrap` still read across modules
- `shared/` holds paging, errors, slugs, CSV, visitor keys and scheduling once; never copy them
  into a module

## HTTP

- Controllers parse, call one use case, and return a response record; requests convert
  themselves into commands (`request.toXxx()`), responses build themselves (`XxxResponse.of(...)`)
- Never return a domain model
- Errors are thrown as `NotFoundException`, `BadRequestException`, `ForbiddenException`,
  `ConflictException` or `UnauthenticatedException`; `GlobalExceptionHandler` sets the status
- Open routes are declared in `shared/security/SecurityConfig`; every admin method also carries
  `@PreAuthorize`. Admins sign in locally (`admins` table, `ROLE_ADMIN`); members sign in
  locally or with a Keycloak token for Google/GitHub

## Persistence

- Plain SQL through `JdbcClient` in `infra/persistence/JdbcXxxStore`; no JPA, no Hibernate
- No query in a loop: related data in one more query per list (`= ANY(:ids)`), counts and sums
  done by PostgreSQL
- The schema changes only through a new Flyway migration (`db-migration` skill); never edit one
  that is merged. Index every foreign key and every filtered or joined column
- Side effects (email, files) run after commit; `Mailer` already defers delivery

## Tests

- Mirror the production package: `src/test/.../<module>/{api,application,domain,infra}/`
- Application tests use copying in-memory fakes (`InMemoryXxxStore`) and assert on what was
  stored; gateways are mocked
- `*Test` runs with `./mvnw test` (no Docker); `*IT` extends `support/PostgresIT` and runs with
  `./mvnw verify`. Every SQL statement of an adapter has an `*IT`
