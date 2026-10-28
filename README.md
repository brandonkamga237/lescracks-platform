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

## Run it locally

Requirements: Git, Docker, JDK 21, Node 22 and pnpm. No configuration file is needed.

1. Clone the repository and start the services it depends on:

   ```bash
   git clone https://github.com/brandonkamga237/lescracks-platform.git
   cd lescracks-platform
   docker compose up -d
   ```

2. Start the API, from the repository root:

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. In a second terminal, start the web app, from the repository root:

   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

4. Open http://localhost:5173. On the first start the API creates the blog themes, a sample
   article and a sample event.

| | URL | Sign-in |
| --- | --- | --- |
| Web app | http://localhost:5173 | create an account |
| Back office | http://localhost:5173/admin/connexion | `admin` / `admin` |
| API documentation | http://localhost:8080/swagger-ui.html | — |
| Emails sent in development | http://localhost:8025 | — |

To stop the services: `docker compose down` (add `-v` to also erase the local data).

## Contributing

Branches, commit format and review rules are in [CONTRIBUTING.md](CONTRIBUTING.md).

---

© 2026 Brandon Kamga. All rights reserved.
