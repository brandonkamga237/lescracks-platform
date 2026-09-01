---
name: dev-setup
description: Démarrer l'environnement de dev LesCracks (postgres, minio, backend, frontend) ou diagnostiquer pourquoi il ne démarre pas. À utiliser quand on demande de lancer le projet, de le faire tourner en local, ou quand un service refuse de démarrer.
---

# Démarrer LesCracks en local

## Ordre de démarrage

1. **Dépendances** (depuis la racine) :
   ```
   docker compose up -d
   ```
   Aucun `.env` n'est nécessaire : tout a un défaut de dev. Attendre `healthy` :
   ```
   docker compose ps
   ```

2. **Backend** (depuis `backend/`) :
   ```
   ./mvnw spring-boot:run
   ```
   Écoute sur 8080, profil `dev`. Alternative conteneurisée : `docker compose --profile app up -d --build`.

3. **Frontend** (depuis `frontend/`) :
   ```
   pnpm install && pnpm dev
   ```
   Écoute sur 5173. `pnpm` uniquement — jamais `npm`.

Le proxy Vite renvoie `/api`, `/oauth2` et `/login/oauth2` vers `localhost:8080` : ne pas configurer `VITE_API_BASE_URL` en dev, le défaut `/api` suffit.

## Pannes courantes

**`port is already allocated` (5432 / 9000 / 9001)**
Un autre projet occupe le port. Identifier :
```
docker ps --filter "publish=5432" --filter "publish=9000"
```
Puis relancer sur d'autres ports (les variables sont prévues pour ça) :
```
DB_PORT=5433 MINIO_PORT=9002 MINIO_CONSOLE_PORT=9003 docker compose up -d
```
Penser à passer les mêmes `DB_PORT`/`MINIO_PORT` au backend s'il tourne hors conteneur.

**Le backend s'arrête au démarrage sur une erreur de schéma**
`ddl-auto: validate` en dev : Hibernate refuse de démarrer si les entités ne correspondent pas au schéma. C'est voulu. La cause est presque toujours une entité modifiée sans migration Flyway → voir le skill `db-migration`.

**`Flyway ... checksum mismatch`**
Une migration déjà appliquée a été modifiée. Ne jamais « réparer » en éditant le fichier : restaurer son contenu d'origine et créer une nouvelle migration. En dev seulement, on peut repartir de zéro :
```
docker compose down -v && docker compose up -d
```
(`-v` supprime les volumes, donc les données locales — jamais en prod.)

**OAuth GitHub/Google en local**
Les clés sont vides par défaut ; l'app démarre mais les boutons OAuth échouent. Renseigner `GITHUB_CLIENT_ID` / `GOOGLE_CLIENT_ID` (+ secrets) dans un `.env` à la racine pour les tester.

## À ne pas faire
- Ne pas lancer `docker-compose.prod.yml` en local : il attend le réseau Traefik, des images Docker Hub et un `.env` de production.
- Ne pas recréer de `docker-compose.yml` dans `backend/` ou `frontend/` : un seul compose par environnement, à la racine.
