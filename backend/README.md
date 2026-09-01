# LesCracks — Backend

Spring Boot REST API for the LesCracks platform.

Stack: Spring Boot (Java 21), PostgreSQL, Flyway, Spring Security (JWT + OAuth2),
MinIO, JavaMail, springdoc-openapi. `pom.xml` is the source of truth for versions.

## Running it

```bash
# Dependencies (from the repo root)
docker compose up -d

# API on http://localhost:8080, dev profile
./mvnw spring-boot:run

# Tests
./mvnw test

# Package
./mvnw clean package
```

Interactive API documentation: http://localhost:8080/swagger-ui.html

## Layout

```
src/main/java/com/brandonkamga/lescracks/
├── controller/   REST under /api (plus SeoController and SitemapController outside /api)
├── service/
│   ├── interfaces/   contracts
│   └── impl/         business logic
├── domain/       JPA entities and enums
├── dto/          objects exposed by the API
├── repository/   Spring Data JPA
├── mapper/       entity ↔ DTO conversion
├── security/     JWT filter, OAuth2 handlers
├── config/       SecurityConfig, DataInitializer, OpenApiConfig
├── exception/    business exceptions and GlobalExceptionHandler
├── scheduler/    scheduled jobs
└── util/

src/main/resources/
├── application.yaml            shared configuration
├── application-{dev,prod,test}.yml
└── db/migration/               Flyway migrations
```

## Adding an endpoint

An endpoint crosses four layers, and forgetting one is the most common mistake here:

1. **DTO** in `dto/` — never expose a `domain/` entity.
2. **Service** — interface in `service/interfaces/`, implementation in `service/impl/`.
3. **Controller** — returns `ResponseEntity<ApiResponse<T>>`.
4. **SecurityConfig** — the default rule is that `/api/**` requires authentication,
   so a new public endpoint must be declared `permitAll()` explicitly.

Errors are thrown (`ResourceNotFoundException`, `BadRequestException`,
`ForbiddenException`); `GlobalExceptionHandler` turns them into HTTP responses.

Every response uses the `ApiResponse<T>` envelope:

```json
{ "success": true, "message": "...", "data": {}, "timestamp": "...", "path": "..." }
```

## Database schema

**Flyway owns the schema in every environment.** Hibernate runs with
`ddl-auto: validate` and never creates anything. Adding a field to an entity without
the matching migration makes startup fail — that is on purpose.

```bash
# New migration
src/main/resources/db/migration/V{n+1}__description.sql
```

Never edit a migration that is already merged: Flyway stores its checksum, so any
edit breaks startup on every database where it has been applied, production
included. To fix something, add the next migration.

Reference data (roles, application types, resource types) is inserted at startup by
`config/DataInitializer.java`, not by a migration.

## Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Sign up |
| POST | `/api/auth/login` | Sign in, returns the JWT |
| POST | `/api/auth/logout` | Sign out |
| POST | `/api/auth/verify-email` | Verify the address |
| POST | `/api/auth/resend-verification` | Resend the verification email |
| POST | `/api/auth/forgot-password` | Request a password reset |
| POST | `/api/auth/reset-password` | Reset the password with a token |

OAuth2: GitHub and Google, through `/oauth2/authorization/{provider}`.
The JWT is stateless and sent as an `Authorization: Bearer <token>` header.

Roles (`RoleName`): `user`, `premium_user`, `learner`, `admin`.
Routes under `/api/admin/**` require the `admin` role.

## Files and images

Storage goes through MinIO (S3-compatible), never the application disk in
production. Local MinIO console: http://localhost:9001 (`minioadmin` / `minioadmin`).

## SEO

`SeoController` (`/seo/**`) renders server-side HTML snapshots with JSON-LD for
crawlers that do not run JavaScript; Nginx routes bot user-agents to it.
`SitemapController` serves `/api/sitemap.xml`, generated from the database.

A new indexable public page needs three changes at once: `SeoController`, the map in
`frontend/nginx.conf`, and `SitemapController`.

## Configuration

The active profile comes from `SPRING_PROFILES_ACTIVE` (`dev` by default).
Production variables are listed in `.env.example` at the repo root. The main ones:

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL |
| `JWT_SECRET`, `JWT_EXPIRATION` | JWT signature and lifetime |
| `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` | Storage |
| `GITHUB_CLIENT_ID`, `GOOGLE_CLIENT_ID` (and their secrets) | OAuth2 |
| `FRONTEND_URL`, `CORS_ORIGINS` | Links inside emails, CORS |
| `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP |

Any new variable must be added to `.env.example` **and** to `docker-compose.prod.yml`.
