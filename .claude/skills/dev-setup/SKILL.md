---
name: dev-setup
description: Start the LesCracks development environment (postgres, minio, backend, frontend) or work out why it will not start. Use when asked to run the project locally, or when a service refuses to come up.
---

# Running LesCracks locally

## Start order

1. **Dependencies** (from the repo root):
   ```
   docker compose up -d
   ```
   No `.env` is needed: everything has a development default. Wait for `healthy`:
   ```
   docker compose ps
   ```

2. **Backend** (from `backend/`):
   ```
   ./mvnw spring-boot:run
   ```
   Listens on 8080, `dev` profile. Containerised alternative:
   `docker compose --profile app up -d --build`.

3. **Frontend** (from `frontend/`):
   ```
   pnpm install && pnpm dev
   ```
   Listens on 5173. `pnpm` only — never `npm`.

The Vite proxy forwards `/api`, `/oauth2` and `/login/oauth2` to `localhost:8080`, so
do not set `VITE_API_BASE_URL` in development; the `/api` default is enough.

## Common failures

**`port is already allocated` (5432 / 9000 / 9001)**
Another project holds the port. Find it:
```
docker ps --filter "publish=5432" --filter "publish=9000"
```
Then start on different ports (the variables exist for this):
```
DB_PORT=5433 MINIO_PORT=9002 MINIO_CONSOLE_PORT=9003 docker compose up -d
```
Pass the same `DB_PORT` / `MINIO_PORT` to the backend if it runs outside a container.

**A request fails with `column ... does not exist` / `relation ... does not exist`**
There is no ORM to validate the schema at startup: a SQL adapter changed without its
Flyway migration fails on the first query. Run `./mvnw verify` (the `*IT` suite catches
it) and add the migration → see the `db-migration` skill.

**The backend refuses to start: `No admin exists yet and ADMIN_PASSWORD is not set`**
An empty database needs a first admin. Set `ADMIN_PASSWORD` (the dev profile defaults it
to `admin`; prod never does).

**`Flyway ... checksum mismatch`**
A migration that was already applied has been edited. Never "fix" it by editing the
file further: restore its original content and add a new migration. In development
only, you can start from scratch:
```
docker compose down -v && docker compose up -d
```
(`-v` drops the volumes, and therefore the local data — never in production.)

**Google / GitHub sign-in locally**
Those buttons go through the dev Keycloak (`docker compose` starts it on :8081 with the realm in
`keycloak/realm`). Local email and password sign-in needs no Keycloak at all; the Google and
GitHub identity providers need their client keys set in that realm to work.

## Do not

- Do not run `docker-compose.prod.yml` locally: it expects the Traefik network, the
  Docker Hub images and a production `.env`.
- Do not recreate a `docker-compose.yml` under `backend/` or `frontend/`: one compose
  file per environment, at the root.
