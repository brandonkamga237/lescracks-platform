# LesCracks Platform

French-language tech training platform: the Accompagnement 360 mentoring programme,
learning resources, community events and a showcase of its learners.

Monorepo: a Spring Boot API (`backend/`) and a React SPA (`frontend/`), shipped as
separate containers behind Traefik.

| Part | Stack | Notes |
|---|---|---|
| [backend/](backend/README.md) | Spring Boot, PostgreSQL, Flyway, MinIO, JWT + OAuth2 | REST API under `/api` |
| [frontend/](frontend/README.md) | React, Vite, TypeScript, Tailwind, Radix | SPA served by Nginx |

## Quick start

Requirements: Docker, JDK 21, Node 22 and pnpm.

```bash
# 1. Dependencies (PostgreSQL + MinIO) — no .env needed
docker compose up -d

# 2. API — http://localhost:8080
cd backend && ./mvnw spring-boot:run

# 3. SPA — http://localhost:5173
cd frontend && pnpm install && pnpm dev
```

Vite proxies `/api`, `/oauth2` and `/login/oauth2` to `localhost:8080`, so the
frontend needs no configuration in development.

Everything in containers instead:

```bash
docker compose --profile app up -d --build
```

If ports 5432 / 9000 / 9001 are already taken on your machine:

```bash
DB_PORT=5433 MINIO_PORT=9002 MINIO_CONSOLE_PORT=9003 docker compose up -d
```

## Docker files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Local development (profile `app` adds the backend) |
| `docker-compose.prod.yml` | Production, deployed to the VPS by CI |

One compose file per environment, at the root. Do not recreate one under `backend/`
or `frontend/`, and do not rename `docker-compose.prod.yml`: CI refers to it by name.

## Branches and deployment

```
feature/* | fix/* | docs/*  →  develop  →  (PR)  →  main  →  production deploy
hotfix/*                    →  main
```

Every push to `main` runs the GitHub Actions pipeline: build the images, push them
to Docker Hub, then deploy over SSH to the VPS. See `.github/workflows/deploy.yml`.

Production variables are described in `.env.example`; the real `.env` lives on the
server (`/root/lescracks/.env`) and is never committed.

## Conventions

All code is in English — identifiers, files, comments, commit messages. French is
reserved for what users read: the interface, page content, API error messages and
email bodies.

The detailed rules (structure, style, git workflow, architecture decisions) live in
[CLAUDE.md](CLAUDE.md). The workflows where a wrong move is expensive — schema
migration, new endpoint, SEO snapshot — are documented under `.claude/skills/`.

---

Built by **Brandon Kamga**
