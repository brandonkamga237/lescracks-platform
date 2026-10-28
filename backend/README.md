# LesCracks — Backend

REST API of the LesCracks platform.

Spring Boot 3, Java 21, PostgreSQL with Flyway, MinIO for files. Members sign in with an
account or through Google and GitHub.

## Development

Start PostgreSQL and MinIO from the repository root with `docker compose up -d`, then:

```bash
./mvnw spring-boot:run   # http://localhost:8080
./mvnw test              # unit tests
./mvnw verify            # with integration tests (requires Docker)
```

API documentation is served at http://localhost:8080/swagger-ui.html in development.

## Configuration

Development runs on defaults. Production variables are listed in
[`.env.example`](../.env.example).
