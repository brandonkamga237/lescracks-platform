# LesCracks

[![Release](https://img.shields.io/github/v/release/brandonkamga237/lescracks-platform)](https://github.com/brandonkamga237/lescracks-platform/releases)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Flescracks.com)](https://lescracks.com)
[![Last commit](https://img.shields.io/github/last-commit/brandonkamga237/lescracks-platform/develop)](https://github.com/brandonkamga237/lescracks-platform/commits/develop)
![Java 21](https://img.shields.io/badge/Java-21-007396?logo=openjdk&logoColor=white)
![Spring Boot 3](https://img.shields.io/badge/Spring%20Boot-3-6DB33F?logo=springboot&logoColor=white)
![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

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
