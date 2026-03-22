# 🚀 LesCracks Backend

Plateforme de formation tech - API REST avec Spring Boot.

## 🛠️ Stack Technologique

| Technologie | Version | Usage |
|-------------|---------|-------|
| Spring Boot | 4.0.2 | Framework principal |
| Java | 21 | Langage |
| PostgreSQL | Latest | Base de données |
| JPA/Hibernate | Latest | ORM |
| JWT (JJWT) | 0.12.3 | Authentification |
| Spring Security OAuth2 | Latest | OAuth2 (Google, GitHub) |
| Lombok | Latest | Réduction boilerplate |

## 📦 Installation

```bash
# Compiler le projet
./mvnw clean package

# Démarrer l'application
./mvnw spring-boot:run

# Exécuter les tests
./mvnw test
```

## 🔐 Authentification

### Authentification Providers Supportés

| Provider | Type | Statut |
|----------|------|--------|
| Local | Email/Password | ✅ |
| Google | OAuth2 | ✅ |
| GitHub | OAuth2 | ✅ |

### Endpoints Auth

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/register` | Inscription |
| POST | `/auth/login` | Connexion |
| POST | `/auth/logout` | Déconnexion |


## 👥 Gestion Utilisateurs

### Endpoints Users

| Méthode | Endpoint | Rôle Requis | Description |
|---------|----------|-------------|-------------|
| GET | `/api/users` | ADMIN | Lister tous |
| GET | `/api/users/{id}` | USER/ADMIN | Par ID |
| GET | `/api/users/email/{email}` | USER/ADMIN | Par email |
| PUT | `/api/users/{id}` | OWNER | Modifier |
| DELETE | `/api/users/{id}` | OWNER/ADMIN | Supprimer |


## 🔒 Sécurité

- **JWT** : Expiration configurable (défaut: 24h)
- **Password** : BCrypt hashing
- **Validation** : Jakarta Validation
- **Rôles** : USER, ADMIN


## 📝 Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL |
| `GOOGLE_CLIENT_ID` | Google OAuth2 |
| `GITHUB_CLIENT_ID` | GitHub OAuth2 |
| `APP_JWT_SECRET` | Clé secrète JWT |
| `APP_JWT_EXPIRATION` | Expiration JWT (ms) |

---

Développé par **Brandon Kamga**
