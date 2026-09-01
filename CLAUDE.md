# LesCracks Platform
Plateforme de formation tech (FR) : ressources, événements, apprenants, Accompagnement 360.
Monorepo : `frontend/` React + Vite (SPA), `backend/` Spring Boot + PostgreSQL + MinIO.

## Structure
- `backend/src/main/java/com/brandonkamga/lescracks/`
  - `controller/` → REST sous `/api/*` (+ `SeoController` sous `/seo`, hors `/api`)
  - `service/interfaces/` + `service/impl/` → toute logique métier (interface + Impl)
  - `domain/` → entités JPA + enums
  - `dto/` → payloads exposés (jamais les entités)
  - `repository/` → Spring Data JPA
  - `security/jwt/`, `security/oauth/` → filtre JWT, handlers OAuth2 (GitHub, Google)
  - `config/` → SecurityConfig, DataInitializer (seed rôles/types), OpenApiConfig
  - `exception/` → exceptions métier + `GlobalExceptionHandler`
- `backend/src/main/resources/`
  - `application.yaml` + `application-{dev,prod,test}.yml`
  - `db/migration/` → migrations Flyway `V{n}__description.sql`
- `frontend/src/`
  - `pages/` → routes publiques, `pages/admin/` → back-office
  - `components/{landing,cards,resources,admin,layout,common,ui}/`
  - `services/` → `api.ts` (authentifié), `publicApi.ts`, `adminApi.ts`, `auth.ts`
  - `contexts/` → AuthContext, ThemeContext ; `hooks/` → hooks `useXxx`
  - `nginx.conf` → routage bots SEO + proxy `/api` (prod)
- `docker-compose.yml` → stack dev locale (postgres, minio + backend via profil `app`)
- `docker-compose.prod.yml` → stack prod (postgres, minio, backend, frontend, Traefik), déployée par le CI
- `.env.example` → structure des variables prod (aucun secret)
- `.claude/skills/` → skills projet : `git-workflow`, `dev-setup`, `backend-endpoint`, `db-migration`, `frontend-page`, `seo-page`

## Commands (exact)
Backend (depuis `backend/`) :
- **Build**: `./mvnw clean package`
- **Test**: `./mvnw test`
- **Run**: `./mvnw spring-boot:run` (port 8080, profil `dev`)

Docker (depuis la racine) :
- **Deps dev (postgres + minio)**: `docker compose up -d` — aucun `.env` requis
- **Stack dev complète**: `docker compose --profile app up -d --build`

Frontend (depuis `frontend/`) — **pnpm uniquement, jamais npm** :
- **Install**: `pnpm install`
- **Dev**: `pnpm dev` (localhost:5173, proxy `/api` → localhost:8080)
- **Typecheck**: `pnpm typecheck`
- **Lint**: `pnpm lint`
- **Build**: `pnpm build`

Avant tout commit/PR :
1. `cd frontend && pnpm typecheck` ✓
2. `cd frontend && pnpm lint` ✓
3. `cd backend && ./mvnw test` ✓

## Code Style
### Langue (règle transverse)
- **Tout le code est en anglais** : noms de variables, fonctions, classes, fichiers, entités, branches, messages de commit, commentaires
- **Le français est réservé aux textes vus par l'utilisateur** : libellés UI, contenus de pages, messages d'erreur retournés par l'API, corps des mails

### Commentaires
- Strict minimum. Un commentaire explique **pourquoi**, jamais **quoi** — si le code dit déjà quoi, pas de commentaire
- Interdits : en-têtes de fichier décoratifs, javadoc/JSDoc générés sur chaque méthode, commentaires qui paraphrasent la ligne suivante, `// end of function`, code mort commenté
- Justifiés : contournement non évident, contrainte externe, décision contre-intuitive, piège connu

### Backend
- Un service = interface dans `service/interfaces/` + classe `XxxServiceImpl` dans `service/impl/`
- Controllers : retournent `ResponseEntity<ApiResponse<T>>` via `ApiResponse.success(...)` / `.error(...)`
- Ne jamais exposer une entité `domain/` : toujours un DTO
- Erreurs : lever `ResourceNotFoundException` / `BadRequestException` / `ForbiddenException` ; ne pas gérer le status dans le controller, `GlobalExceptionHandler` le fait
- Schéma DB : Flyway uniquement (`ddl-auto: validate` partout). Nouveau champ d'entité ⇒ nouvelle migration `V{n}__...sql`, jamais modifier une migration déjà appliquée
- Lombok (`@Data`, `@Builder`) sur les DTO/entités ; logging `slf4j`
- Endpoints publics vs protégés déclarés dans `SecurityConfig` ; rôles : `user`, `premium_user`, `learner`, `admin`
- Messages destinés à l'utilisateur (mails, erreurs API) en français ; le reste en anglais

### Frontend
- Alias imports `@/...` (jamais de chemins relatifs profonds)
- Appels API uniquement dans `src/services/*` : `publicApi` (sans token), `api` (JWT), `adminApi` (admin)
- Base URL via `ENV.API_BASE_URL` (`src/config/env.ts`), jamais d'URL en dur
- Tailwind pour le style (pas de styles inline) ; primitives Radix dans `components/ui/`
- Props typées : `interface {ComponentName}Props`
- Pages en PascalCase dans `pages/`, hooks `useXxx` dans `hooks/`
- Textes affichés en français ; identifiants, props et commentaires en anglais

## Workflow
### Branches
- `main` → production. Tout push déclenche le déploiement (GitHub Actions → Docker Hub → VPS)
- `develop` → intégration. Cible par défaut de tout nouveau travail
- `feature/xxx`, `fix/xxx`, `docs/xxx` → partent de `develop`, y reviennent par PR
- `hotfix/xxx` → part de `main`, urgence prod uniquement
- Ne jamais coder directement sur `main` ni sur `develop` : créer la branche avant la première modification

### Commits
- Commiter **au fil de l'eau**, pas en un bloc à la fin : un commit dès qu'une unité cohérente compile et passe les checks
- Un commit = un changement logique. Ne pas mélanger refacto, feature et formatage
- Format : `type(scope): description` en anglais (`feat`, `fix`, `refactor`, `docs`, `chore`, `test`)
- **Ne jamais mentionner Claude, l'IA ou un outil de génération** : pas de trailer `Co-Authored-By: Claude`, pas de « Generated with », pas de mention dans le corps. L'auteur est l'utilisateur, point
- Ne pas commiter sans que `pnpm typecheck` / `./mvnw test` passent sur la partie touchée

### Interdits
- NEVER : `git push --force`, commiter `.env`, hardcoder JWT_SECRET / clés MinIO / secrets OAuth
- NEVER : modifier une migration Flyway déjà mergée (créer `V{n+1}`)
- Nouvelle variable d'env ⇒ l'ajouter à `.env.example` ET à `docker-compose.prod.yml`
- Un seul compose par environnement, à la racine : ne pas recréer de compose dans `backend/` ou `frontend/`
- Ne jamais renommer `docker-compose.prod.yml` (le CI le référence par nom : filtre `paths`, `scp`, `up -d`)
- Dépendances front : `pnpm add/remove` ⇒ commiter `pnpm-lock.yaml` (ne pas générer de `package-lock.json`)

## Architecture
- SPA client-rendered → nginx redirige les user-agents bots vers `/seo/*` (snapshots HTML + JSON-LD rendus par le backend). Toute nouvelle page publique indexable doit avoir son snapshot dans `SeoController` + son entrée nginx
- Flyway propriétaire du schéma (Hibernate valide seulement) → évite les divergences dev/prod
- JWT stateless + OAuth2 (GitHub, Google) → pas de session serveur
- MinIO (S3-compatible) pour fichiers/images, pas de stockage disque applicatif en prod
- Front et back déployés en conteneurs séparés derrière Traefik ; le front ne parle au back que via `/api/*`

## Vocabulary
- **Accompagnement 360** = programme d'accompagnement principal ; candidature = `Application` sans `event`
- **Application** = candidature (360) ou inscription à un événement (`event != null`)
- **Learner / Apprenant** = profil public d'un participant (page `/apprenants/{slug}`)
- **Premium** = ressource ou utilisateur (`premium_user`) à accès restreint ; `PremiumRequest` = demande d'upgrade
- **Resource** = contenu (VIDEO/DOCUMENT), `EXTERNAL` (lien) ou `UPLOADED` (MinIO)
- **Snapshot SEO** = HTML server-rendered servi aux bots à la place de la SPA
