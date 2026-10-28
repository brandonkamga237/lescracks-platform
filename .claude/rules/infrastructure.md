---
paths:
  - "docker-compose*.yml"
  - ".env.example"
  - ".github/**"
  - "frontend/nginx.conf"
  - "**/Dockerfile"
  - "monitoring/**"
  - "keycloak/**"
  - "docker/**"
---

# Infrastructure conventions

- One compose file per environment, at the root: never create one under `backend/` or
  `frontend/`
- Never rename `docker-compose.prod.yml`: `deploy.yml` copies and runs it by name. Its backend
  and frontend images take their tag from `IMAGE_TAG`
- A new environment variable goes into `.env.example` and `docker-compose.prod.yml` in the same
  commit. A secret never gets a default value in production configuration
- Pin image versions; `latest` makes a restart change what runs
- CI (`.github/workflows/ci.yml`) gates every PR; `release.yml` (release-please) tags versions;
  `deploy.yml` ships a tag to the VPS, and a rollback is a manual run of it with an earlier tag
- A new indexable public page needs its snapshot in `SeoController` and its entry in
  `frontend/nginx.conf` (`seo-page` skill)
- Production is checked over `ssh contabo`, read-only, with the `release-verifier` subagent
