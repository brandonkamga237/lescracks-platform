---
name: backend-endpoint
description: Add or change a REST endpoint or a domain service in the LesCracks backend, following the controller → domain command → service interface/impl → entity chain, the dependency direction, SOLID and the patterns already in use. Use whenever the Spring Boot API or its business code changes (new route, newly exposed field, new email, changed permissions).
---

# Adding an endpoint

## The full chain

Code is organised by business domain: everything below lives under `<feature>/`
(`identity`, `resource`, `taxonomy`, `event`, `newsletter`, `stats`, `storage`, `mail`,
`seo`, `cracklab`, `talk`), with `api/` for HTTP, `domain/` for entities and business
logic, `infra/` for repositories and external adapters.

1. **Request / response** — `<feature>/api/dto/XxxRequest.java`, `XxxResponse.java`
   Java records. Validation (`@NotBlank`, `@Size`, `@Email`…) on requests only. Never
   expose an entity.
   - A request translates itself into a domain command: `public Registration toRegistration()`.
   - A response builds itself from entities: `public static UserProfileResponse of(User user, …)`.

2. **Domain command** — `<feature>/domain/Xxx.java`, a record with only what the business
   rule needs (`Registration`, `ProfileChanges`, `Credentials`). No validation annotation,
   no JSON concern: it is the input of the service, whatever the transport.

3. **Service** — interface `<feature>/domain/XxxService.java` + `XxxServiceImpl.java`.
   Takes commands or plain values, returns entities or values. All business rules live
   here, never in the controller.

4. **Controller** — `<feature>/api/XxxController.java`: parse, call one service method,
   shape the response. Nothing else.
   ```java
   @PostMapping("/register")
   public ResponseEntity<UserAuthResponse> register(@Valid @RequestBody UserRegisterRequest request) {
       return ResponseEntity.status(201).body(response(registration.register(request.toRegistration())));
   }
   ```
   Errors: throw `NotFoundException`, `BadRequestException`, `ForbiddenException` or
   `ConflictException` (`shared/exception`); `GlobalExceptionHandler` sets the status and
   the French message. Never build an error status by hand.

5. **SecurityConfig** — `shared/security/SecurityConfig.java`. `/api/**` is authenticated
   by default: a public route is declared `permitAll()` above that line, method by method.
   `/api/admin/**` and `/api/*/admin/**` need `hasRole("ADMIN")`; add `@PreAuthorize` on
   admin controllers too.

## Dependency direction (non-negotiable)

```
api  ──▶  domain  ◀──  infra
```

- `domain` never imports from any `api` package: no request, no response, no controller.
  If a service signature needs a DTO, create a domain command instead.
- `infra` never imports from `api`.
- A controller never touches a repository: it goes through its domain service.
- A domain reaches another domain through that domain's **service interface**, never its
  repositories or entities' persistence. Example: `newsletter` uses `identity`'s
  `UserDirectory` (`find`, `require`, `createContact`), not `UserRepository`.
  Exceptions, read-only by design: `stats`, `seo`, `shared/bootstrap`.

## SOLID, applied here

- **Single responsibility** — one service per use case family, not per entity. Identity
  has `UserRegistrationService`, `UserAuthService`, `EmailVerificationService`,
  `PasswordResetService`, `UserProfileService`: a change to password reset never
  touches sign-up. When a service passes ~150 lines or its constructor takes more than
  five collaborators, it is doing two jobs: split it.
- **Open/closed** — a new variant is a new class, not a new `if`/`switch` branch or a new
  method on a shared interface. Adding an email = a record implementing `mail.domain.Email`
  plus an `EmailTemplate` bean; `Mailer` and the other templates do not change.
- **Liskov** — an implementation honours its interface's contract (`resend` stays silent
  on unknown addresses in every implementation; a test double does too).
- **Interface segregation** — callers depend on the narrow interface they use
  (`UserDirectory` for other domains, not the whole profile service).
- **Dependency inversion** — services depend on interfaces (`Mailer`, `StorageService`,
  `PasswordEncoder`), wired by constructor injection, never `new` on a collaborator and
  never field `@Autowired`. This is what lets every service be unit tested with mocks.

## Patterns already in use — reuse them before inventing another

| Pattern | Where | Use it when |
| --- | --- | --- |
| Command object | `Registration`, `ProfileChanges`, `OnboardingAnswers` (identity/domain) | A service needs several inputs from a request |
| Strategy + registry | `EmailTemplate<T>` picked by type in `EmailTemplates` (mail/infra) | Several variants of one behaviour, chosen at runtime |
| Facade across domains | `UserDirectory` (identity/domain) | Another domain needs people without knowing identity's storage |
| Deferred side effect | `SmtpMailer` sends after commit (`TransactionSynchronization`) | A side effect (email, webhook) must not run for a rolled-back change, nor fail it |
| Value helper | `OneTimeTokens`, `PhoneNumbers`, `ProfileCompletion` | A rule used by several services, with no state of its own |

Do not add a pattern for one case: an interface with a single implementation that will
never vary, a factory for one class, a generic base service. Two real variants first.

## Conventions

- Roles come from the Keycloak realm (`user`, `admin`) or the local session; in Spring,
  `hasRole("ADMIN")`.
- Text shown to users (emails, error messages) stays in French; everything else is English.
- Logging: `slf4j`, INFO for business actions, DEBUG for technical detail. Never log a
  token, a password or the body of an email.
- Files go through `StorageService` (MinIO), never the local disk.
- Emails go through `Mailer.send(new XxxEmail(...))`, never `JavaMailSender` directly.

## Tests that come with the change

Mirror the production package (`src/test/.../<feature>/{api,domain,infra}/`).
- Every new service method: a `*Test` with Mockito on its collaborators, one test per
  rule (`@DisplayName` states the rule in a sentence).
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
