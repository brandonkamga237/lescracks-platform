---
name: backend-endpoint
description: Add or change a REST endpoint or a use case in the LesCracks backend, step by step — request/response, command, application service, port and adapter, assembly, controller, security. Follows the design-patterns skill. Use whenever the Spring Boot API or its business code changes (new route, newly exposed field, new email, changed permissions).
---

# Adding an endpoint

Read `.claude/skills/design-patterns/SKILL.md` first: it defines the modules, the skeleton,
the dependency rule and the patterns. This file is the step-by-step for one endpoint.

## The full chain

Everything lives under `<module>/` (`account`, `member`, `newsletter`, `content`, `event`,
`engagement`, `recognition`, `taxonomy`, `notification`, `analytics`, `storage`, `seo`).
Modules not yet moved to the skeleton keep `api/`, `domain/`, `infra/`; new code in them still
follows the steps below as closely as their layout allows.

1. **Request / response** — `<module>/api/dto/XxxRequest.java`, `XxxResponse.java`.
   Java records. Validation (`@NotBlank`, `@Size`, `@Email`…) on requests only. Never
   expose a domain model or an entity.
   - A request translates itself into a command: `public Registration toRegistration()`.
   - A response builds itself from the model: `public static UserProfileResponse of(User user, …)`.

2. **Command** — `<module>/application/Xxx.java`, a record with only what the use case
   needs. No validation annotation, no JSON concern.

3. **Use case** — interface `<module>/application/XxxService.java` + `XxxServiceImpl.java`,
   plain Java. It loads aggregates through ports (`domain/port`), applies the rules held by
   the model (`domain/model`), and **saves explicitly** through the port.

4. **Port and adapter** — when the use case needs I/O that no port offers yet, add the
   interface in `domain/port` and its implementation in `infra/<technology>/` or
   `infra/persistence/` (entity + `XxxJpaRepository` + `JpaXxxStore` + mapper).

5. **Assembly** — `<module>/infra/config/XxxServices.java` builds the service with
   `transactional.wrap(XxxService.class, new XxxServiceImpl(...))`. Name read methods
   `find/require/list/search/count…` so they run read-only.

6. **Controller** — `<module>/api/XxxController.java`: parse, call one service method,
   shape the response. Nothing else.
   ```java
   @PostMapping("/register")
   public ResponseEntity<UserAuthResponse> register(@Valid @RequestBody UserRegisterRequest request) {
       return ResponseEntity.status(201).body(response(registration.register(request.toRegistration())));
   }
   ```
   Errors: throw `NotFoundException`, `BadRequestException`, `ForbiddenException`,
   `ConflictException` or `UnauthenticatedException` (`shared/exception`); they carry an
   `ErrorCode` and `GlobalExceptionHandler` maps it to the status. Never build a status by hand.

7. **SecurityConfig** — `shared/security/SecurityConfig.java`. `/api/**` is authenticated
   by default: a public route is declared `permitAll()` above that line, method by method.
   `/api/admin/**` and `/api/*/admin/**` need `hasRole("ADMIN")`; add `@PreAuthorize` on
   admin controllers too.

## Conventions

- Roles come from the Keycloak realm (`user`, `admin`) or the local session; in Spring,
  `hasRole("ADMIN")`.
- Text shown to users (emails, error messages) stays in French; everything else is English.
- Logging: `slf4j`, INFO for business actions, DEBUG for technical detail. Never log a
  token, a password or the body of an email.
- Files go through `StorageService` (MinIO), never the local disk.
- Emails go through `Mailer.send(new XxxEmail(...))`, never `JavaMailSender` directly.

## Tests that come with the change

Mirror the production package (`src/test/.../<module>/{api,application,domain,infra}/`).
- Every new use case: a `*Test` with fakes for stores (`InMemoryXxxStore`, copying) and
  mocks for gateways, one test per rule (`@DisplayName` states the rule in a sentence).
  Assert on what was stored.
- Every new email template: assert the link, the escaping and the text part.
- Persistence or query changes: a `*IT` extending `support/PostgresIT`.

## On the frontend side
A new endpoint is called from `frontend/src/services/` only:
- `api.ts` whether it is `permitAll` or authenticated — the session cookie goes out either way
- `adminApi.ts` if it lives under `/api/admin`

## Verify
```
cd backend && ./mvnw test      # ./mvnw verify when persistence changed (needs Docker)
```
Then check the route in Swagger: `http://localhost:8080/swagger-ui.html`.
