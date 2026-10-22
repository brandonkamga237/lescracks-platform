---
name: design-patterns
description: The architecture, SOLID rules and design patterns every LesCracks backend change must follow — module skeleton, ports and adapters, where each pattern applies, what to reuse from shared/kernel, and the checklist to run before committing. Use for every backend feature, fix or refactor, and whenever deciding where a class goes or whether a pattern is worth it.
---

# Architecture and design patterns

Non-negotiable: every module, feature and fix follows this file. A change that does not fit
it is redesigned, not merged. `ArchitectureTest` enforces the mechanical part in CI; the rest
is on the author and the reviewer.

## 1. Modules: one business capability each

| Module | Owns | Never owns |
| --- | --- | --- |
| `account` | Signing in: accounts, passwords, one-time tokens, Google/GitHub links, admins (own table) | Profile, newsletter, analytics |
| `member` | Public profile, welcome answers (situation, goal, interests, phone) | Credentials |
| `newsletter` | Subscribers (own table, optional link to an account), campaigns | Accounts |
| `content` | Articles and Talk videos, on the shared publication lifecycle | Comments, likes, views |
| `event` | Events, registrations, hackathon submissions | Comments, views |
| `engagement` | Views, likes, comments, reports — on any target (article, event, talk) | The targets themselves |
| `recognition` | Badges, certificates | — |
| `taxonomy` | Themes (categories), tags | — |
| `notification` | Email templates and delivery | Business decisions about who gets what |
| `analytics` | Dashboard aggregates, read through each module's query port | Writes |
| `storage`, `seo` | Files (MinIO), bot snapshots | — |
| `shared/kernel` | Reusable building blocks (below) | Business rules of any module |

A new feature first answers: *which capability is this?* If the answer is "two of them", it is
two changes talking through a port or an event. If no module fits, propose a new one — never
stretch an existing module to hold an unrelated concept (that is how `identity` ended up
storing newsletter contacts and marketing attribution).

## 2. The skeleton (same in every module)

```
<module>/
  api/                  controllers: parse, call one use case, shape the response
  api/dto/              XxxRequest (validation, toCommand()), XxxResponse (static of(...))
  application/          use cases: XxxService interface + XxxServiceImpl, command records
  domain/model/         aggregates, value objects, enums, domain events — plain Java
  domain/port/          interfaces the module needs from outside: stores, gateways, clocks
  infra/persistence/    XxxEntity (JPA), XxxJpaRepository, JpaXxxStore (the adapter), mappers
  infra/<technology>/   jwt/, smtp/, minio/, metrics/… one adapter per port
  infra/config/         @Configuration assembling application services, with their transactions
```

Dependency rule, checked by `ArchitectureTest`:

```
api ──▶ application ──▶ domain ◀── infra
```

- `domain` and `application` are plain Java: no `org.springframework`, `jakarta.persistence`,
  `jakarta.servlet`, `org.hibernate`, `io.micrometer`. Lombok, slf4j and pure libraries
  (libphonenumber) are allowed: they do no I/O and hold no framework state.
- `domain` imports nothing from `application`, `api` or `infra`.
- `infra` implements ports; it never holds a business rule.
- Another module is reached through its `application` interfaces (or a published event),
  never its `domain/port`, `infra` or entities. `analytics` reads through query ports each
  module exposes for it.
- Spring annotations live in `api` and `infra` only. Application services are built in
  `infra/config` and wrapped by `TransactionalServices` (reads by name prefix
  `find/require/list/search/count` are read-only, everything else read-write).

## 3. SOLID, concretely

- **S** — one service per use-case family (`SignUpService`, `SignInService`,
  `PasswordResetService`), not one per table. Over ~150 lines or more than five collaborators:
  it does two jobs, split it.
- **O** — a new variant is a new class: a new email is a record + an `EmailTemplate`; a new
  reaction target is a new `TargetType` value, not a new table and service.
- **L** — every implementation of a port honours its contract, test doubles included
  (`InMemoryUserStore` copies like a database, so a forgotten `save` fails the test).
- **I** — narrow ports: other modules get `MemberDirectory`, not the whole profile service.
- **D** — services depend on ports, receive them by constructor, never `new` a collaborator,
  never field injection.

## 4. The patterns we use — and when

| Pattern | Use it for | Example |
| --- | --- | --- |
| **Ports & Adapters** | Anything that touches I/O: database, mail, files, tokens, metrics | `UserStore` ← `JpaUserStore`; `PasswordHasher` ← `BCryptPasswordHasher` |
| **Repository (as a port)** | Loading and saving an aggregate | `UserStore.save(user)` returns the stored copy; always save explicitly, there is no dirty checking in the domain |
| **Data Mapper** | Entity ⇄ domain model, inside `infra/persistence` only | `UserEntityMapper.toDomain/copy` |
| **Aggregate** | A cluster changed together, one root, one store | `Event` with its registrations rules; reference other aggregates **by id** |
| **Value Object** | A concept with rules and no identity | `PhoneNumber`, `Slug`, `EmailAddress`, `PageQuery` — immutable records that validate in their constructor |
| **Command** | A use case with several inputs | `Registration`, `ProfileChanges`; built by `Request.toCommand()` |
| **Strategy + Registry** | Several variants of one behaviour picked at runtime | `EmailTemplate<T>` in `EmailTemplates`; reaction targets resolved by `TargetType` |
| **Facade** | What another module may know about yours | `UserDirectory` / `MemberDirectory` |
| **Domain Event (Observer)** | A side effect owned by another module | `MemberRegistered` → newsletter subscribes; published through a port (`MemberEvents`), delivered by Spring in infra |
| **Decorator / Proxy** | Cross-cutting behaviour around a service | `TransactionalServices.wrap` adds the transaction without touching the service |
| **Specification** | Combinable query filters | `UserSpecifications.matching(search)` — in infra, built from a domain search record |
| **Template Method** | Same flow, varying steps | Publication lifecycle: schedule → publish → announce, with the announce step varying |
| **Factory method** | Construction with rules (defaults, normalisation) | `Account.register(email, hash)`; static `of(...)` on responses |
| **Builder** | Many optional fields | Lombok `@Builder` on models and fakes; never on a value object with invariants |
| **Anti-corruption layer** | Translating an outside model | `JwtIdentityTokenVerifier` turns a `Jwt` into `IdentityClaims`; the domain never sees `Jwt` |
| **Unit of Work** | One business action = one transaction | The transactional proxy; side effects after commit (`SmtpMailer`) |

Do **not** add a pattern for a single case: an interface with one implementation that will
never vary (ports are the exception: they exist for the dependency rule and for tests), a
factory for one constructor, a generic `BaseService<T>`, an abstract class "for later". Two
real variants first, then the abstraction.

## 5. Reuse before writing: shared/kernel

Before writing any of these, use or extend the kernel one:

- Paging: `PageQuery`, `Paged<T>` (domain) and `PageResponse.of(paged, mapper)` (api).
- Errors: `NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException`,
  `UnauthenticatedException` — they carry an `ErrorCode`; never an HTTP status.
- Publication lifecycle (status, slug, cover, scheduled/published dates), slugs, CSV export,
  visitor keys, one-time tokens: one implementation each in the kernel. A second copy in a
  module is a review blocker.

If two modules need the same thing and the kernel lacks it, move it to the kernel in its own
commit first, then use it.

## 6. Database rules

- One table belongs to one module. Cross-module links are `xxx_id` columns with a foreign key,
  never a JPA relation to another module's entity.
- Same concept, same shape everywhere: `TIMESTAMPTZ` for every instant, `VARCHAR(220)` slugs,
  `VARCHAR(1000)` URLs, `status VARCHAR(20)` with a `CHECK`.
- Identify people by id, never by email.
- Generic over copied: a reaction, view or comment table has `target_type` + `target_id`
  rather than one table per content kind.
- Schema changes only through a new Flyway migration (`db-migration` skill). Data moves keep
  ids stable so foreign keys survive.

## 7. Tests that prove the design

- `application`: unit tests with **fakes** for stores (`InMemoryXxxStore`, copying) and mocks
  for gateways; assert on what was stored, not on the object you passed in.
- `domain/model`: plain unit tests of the rules, no mocks.
- `infra/persistence`: `*IT` on PostgreSQL (`PostgresIT`) for mappings and queries.
- `api`: `@WebMvcTest` slices for status codes, validation and security.
- `ArchitectureTest`: add the module to its lists once it follows the skeleton.

## 8. Checklist before every commit

1. Which module owns this? Is it in the right folder of the skeleton?
2. Does `domain`/`application` import anything from Spring, JPA, servlet, `infra` or `api`?
3. Is every change to an aggregate saved through its store?
4. Is anything here already in `shared/kernel` or another module? Reuse it.
5. Did I add an abstraction with a single case? Remove it.
6. Did I touch another module's tables, entities or repositories? Go through its interface.
7. Tests: application with fakes, IT for persistence, `ArchitectureTest` green.
