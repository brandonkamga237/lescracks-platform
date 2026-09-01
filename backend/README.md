# LesCracks — Backend

API REST Spring Boot de la plateforme LesCracks.

Stack : Spring Boot (Java 21), PostgreSQL, Flyway, Spring Security (JWT + OAuth2),
MinIO, JavaMail, springdoc-openapi. Les versions font foi dans `pom.xml`.

## Démarrer

```bash
# Dépendances (depuis la racine du dépôt)
docker compose up -d

# API sur http://localhost:8080, profil dev
./mvnw spring-boot:run

# Tests
./mvnw test

# Package
./mvnw clean package
```

Documentation interactive de l'API : http://localhost:8080/swagger-ui.html

## Structure

```
src/main/java/com/brandonkamga/lescracks/
├── controller/   REST sous /api (+ SeoController et SitemapController hors /api)
├── service/
│   ├── interfaces/   contrats
│   └── impl/         logique métier
├── domain/       entités JPA et enums
├── dto/          objets exposés par l'API
├── repository/   Spring Data JPA
├── mapper/       conversions entité ↔ DTO
├── security/     filtre JWT, handlers OAuth2
├── config/       SecurityConfig, DataInitializer, OpenApiConfig
├── exception/    exceptions métier et GlobalExceptionHandler
├── scheduler/    tâches planifiées
└── util/

src/main/resources/
├── application.yaml            base commune
├── application-{dev,prod,test}.yml
└── db/migration/               migrations Flyway
```

## Ajouter un endpoint

Un endpoint traverse quatre couches, et en oublier une est l'erreur la plus fréquente :

1. **DTO** dans `dto/` — ne jamais exposer une entité `domain/`.
2. **Service** — interface dans `service/interfaces/`, implémentation dans `service/impl/`.
3. **Controller** — retourne `ResponseEntity<ApiResponse<T>>`.
4. **SecurityConfig** — la règle par défaut est `/api/**` authentifié : un nouvel
   endpoint public doit être déclaré `permitAll()` explicitement.

Les erreurs se lèvent (`ResourceNotFoundException`, `BadRequestException`,
`ForbiddenException`) ; `GlobalExceptionHandler` produit la réponse HTTP.

Toutes les réponses suivent l'enveloppe `ApiResponse<T>` :

```json
{ "success": true, "message": "...", "data": {}, "timestamp": "...", "path": "..." }
```

## Schéma de base

**Flyway est propriétaire du schéma dans tous les environnements**, Hibernate tourne
en `ddl-auto: validate` et ne crée jamais rien. Ajouter un champ à une entité sans
migration correspondante fait échouer le démarrage — c'est volontaire.

```bash
# Nouvelle migration
src/main/resources/db/migration/V{n+1}__description.sql
```

Ne jamais modifier une migration déjà mergée : Flyway en stocke le checksum, toute
édition casse le démarrage sur les bases où elle est appliquée, production comprise.
Pour corriger, créer la migration suivante.

Les données de référence (rôles, types de candidature, types de ressource) sont
insérées au démarrage par `config/DataInitializer.java`, pas par migration.

## Authentification

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion, retourne le JWT |
| POST | `/api/auth/logout` | Déconnexion |
| POST | `/api/auth/verify-email` | Vérification de l'adresse |
| POST | `/api/auth/resend-verification` | Renvoi du mail de vérification |
| POST | `/api/auth/forgot-password` | Demande de réinitialisation |
| POST | `/api/auth/reset-password` | Réinitialisation par token |

OAuth2 : GitHub et Google, via `/oauth2/authorization/{provider}`.
Le JWT est stateless, transmis en en-tête `Authorization: Bearer <token>`.

Rôles (`RoleName`) : `user`, `premium_user`, `learner`, `admin`.
Les routes `/api/admin/**` exigent le rôle `admin`.

## Fichiers et images

Le stockage passe par MinIO (compatible S3), jamais par le disque applicatif en
production. Console MinIO en local : http://localhost:9001 (`minioadmin` / `minioadmin`).

## SEO

`SeoController` (`/seo/**`) rend des snapshots HTML serveur avec JSON-LD pour les
crawlers qui n'exécutent pas JavaScript ; Nginx y redirige les user-agents de bots.
`SitemapController` expose `/api/sitemap.xml`, généré depuis la base.

Une nouvelle page publique indexable demande trois modifications conjointes :
`SeoController`, la map de `frontend/nginx.conf`, et `SitemapController`.

## Configuration

Le profil actif vient de `SPRING_PROFILES_ACTIVE` (`dev` par défaut). Les variables
de production sont listées dans `.env.example` à la racine du dépôt. Les principales :

| Variable | Rôle |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL |
| `JWT_SECRET`, `JWT_EXPIRATION` | Signature et durée de vie du JWT |
| `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` | Stockage |
| `GITHUB_CLIENT_ID`, `GOOGLE_CLIENT_ID` (+ secrets) | OAuth2 |
| `FRONTEND_URL`, `CORS_ORIGINS` | Liens dans les mails, CORS |
| `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP |

Toute nouvelle variable doit être ajoutée à `.env.example` **et** à
`docker-compose.prod.yml`.
