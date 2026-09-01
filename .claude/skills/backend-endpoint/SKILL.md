---
name: backend-endpoint
description: Add or change a REST endpoint in the LesCracks backend, following the controller → service interface/impl → DTO → SecurityConfig chain. Use whenever the Spring Boot API changes (new route, newly exposed field, changed permissions).
---

# Adding an endpoint

## The full chain

An endpoint always touches **four places**. Forgetting one is the most frequent
mistake in this codebase.

1. **DTO** — `dto/XxxRequest.java` / `dto/XxxResponse.java`
   Never expose a `domain/` entity directly. Lombok `@Data @Builder`, `@Schema`
   annotations for OpenAPI, and `@NotBlank` / `@NotNull` / `@Size` validation on
   request objects.

2. **Service** — interface in `service/interfaces/XxxService.java`, implementation in
   `service/impl/XxxServiceImpl.java`
   All business logic lives here, never in the controller. Entity to DTO mapping
   happens in the implementation.

3. **Controller** — `controller/XxxController.java`, `@RequestMapping("/api/...")`
   Expected shape:
   ```java
   @PostMapping
   public ResponseEntity<ApiResponse<XxxResponse>> create(@Valid @RequestBody XxxRequest req) {
       return ResponseEntity.ok(ApiResponse.success(xxxService.create(req), "Créé"));
   }
   ```
   Never build an error status by hand: throw `ResourceNotFoundException`,
   `BadRequestException` or `ForbiddenException` and let `GlobalExceptionHandler`
   produce the response.

4. **SecurityConfig** — `config/SecurityConfig.java`
   The default rule is `.requestMatchers("/api/**").authenticated()`. **A new endpoint
   is therefore protected until it is declared `permitAll()` above that line.** Public
   routes are listed method by method:
   ```java
   .requestMatchers(HttpMethod.GET, "/api/xxx", "/api/xxx/*").permitAll()
   ```
   Admin routes are already covered by `.requestMatchers("/api/admin/**").hasRole("ADMIN")`.

## Conventions

- Roles: `user`, `learner`, `admin` (the `RoleName` enum). In Spring,
  `hasRole("ADMIN")` (uppercase, without the `ROLE_` prefix).
- Response envelope: always `ApiResponse<T>` (`success`, `message`, `data`,
  `timestamp`, `path`).
- Text shown to users (emails, error messages) stays in French; everything else is English.
- Logging: `slf4j`, INFO for business actions, DEBUG for technical detail. Never log a
  token, a password or the body of an email.
- An endpoint that reads or writes a file goes through MinIO (`ImageAssetService`),
  never the local disk.

## On the frontend side
A new endpoint is called from `frontend/src/services/` only:
- `api.ts` whether it is `permitAll` or authenticated — the session cookie goes out either way
- `adminApi.ts` if it lives under `/api/admin`

## Verify
```
cd backend && ./mvnw test
```
Then check the route in Swagger: `http://localhost:8080/swagger-ui.html`.
