# LesCracks

The platform behind [lescracks.com](https://lescracks.com): a tech blog, events and
hackathons, the LesCracks Talk, member profiles with badges and certificates, and a
newsletter.

| | |
| --- | --- |
| [`backend/`](backend/README.md) | REST API — Spring Boot 3, Java 21, PostgreSQL, MinIO |
| [`frontend/`](frontend/README.md) | Web app — React, TypeScript, Vite, Tailwind |

## Getting started

Requirements: Docker, JDK 21, Node 22, pnpm.

```bash
docker compose up -d                         # PostgreSQL and MinIO
(cd backend && ./mvnw spring-boot:run)       # API on http://localhost:8080
(cd frontend && pnpm install && pnpm dev)    # app on http://localhost:5173, in a second terminal
```

No configuration is needed in development.

## Contributing

Branches, commit format and review rules are in [CONTRIBUTING.md](CONTRIBUTING.md).

---

© 2026 Brandon Kamga. All rights reserved.
