# LesCracks Platform

Plateforme de formation tech francophone : accompagnement 360, ressources pédagogiques,
événements communautaires et vitrine des apprenants.

Monorepo : une API Spring Boot (`backend/`) et une SPA React (`frontend/`), déployées
en conteneurs séparés derrière Traefik.

| Partie | Stack | Détail |
|---|---|---|
| [backend/](backend/README.md) | Spring Boot, PostgreSQL, Flyway, MinIO, JWT + OAuth2 | API REST sous `/api` |
| [frontend/](frontend/README.md) | React, Vite, TypeScript, Tailwind, Radix | SPA servie par Nginx |

## Démarrage rapide

Prérequis : Docker, JDK 21, Node 22 + pnpm.

```bash
# 1. Dépendances (PostgreSQL + MinIO) — aucun .env requis
docker compose up -d

# 2. API — http://localhost:8080
cd backend && ./mvnw spring-boot:run

# 3. SPA — http://localhost:5173
cd frontend && pnpm install && pnpm dev
```

Vite proxifie `/api`, `/oauth2` et `/login/oauth2` vers `localhost:8080` : rien à
configurer côté frontend en développement.

Variante tout-en-conteneurs :

```bash
docker compose --profile app up -d --build
```

Si les ports 5432 / 9000 / 9001 sont déjà pris sur ta machine :

```bash
DB_PORT=5433 MINIO_PORT=9002 MINIO_CONSOLE_PORT=9003 docker compose up -d
```

## Fichiers Docker

| Fichier | Usage |
|---|---|
| `docker-compose.yml` | Développement local (profil `app` pour inclure le backend) |
| `docker-compose.prod.yml` | Production, déployé sur le VPS par la CI |

Un seul compose par environnement, à la racine. Ne pas en recréer dans `backend/`
ou `frontend/`, et ne pas renommer `docker-compose.prod.yml` : la CI le référence
par son nom.

## Branches et déploiement

```
feature/* | fix/* | docs/*  →  develop  →  (PR)  →  main  →  déploiement prod
hotfix/*                    →  main
```

Tout push sur `main` déclenche la CI GitHub Actions : build des images, push sur
Docker Hub, puis déploiement par SSH sur le VPS. Voir `.github/workflows/deploy.yml`.

Les variables de production sont décrites dans `.env.example` ; le `.env` réel vit
sur le serveur (`/root/lescracks/.env`) et n'est jamais commité.

## Conventions

Tout le code est en anglais — identifiants, fichiers, commentaires, messages de
commit. Le français est réservé aux textes lus par l'utilisateur : interface,
contenus, messages d'erreur de l'API et corps des mails.

Les règles détaillées (structure, style, workflow git, décisions d'architecture)
sont dans [CLAUDE.md](CLAUDE.md). Les workflows sensibles — migration de schéma,
ajout d'endpoint, snapshot SEO — sont documentés dans `.claude/skills/`.

---

Développé par **Brandon Kamga**
