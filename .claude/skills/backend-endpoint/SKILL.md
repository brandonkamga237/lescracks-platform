---
name: backend-endpoint
description: Ajouter ou modifier un endpoint REST du backend LesCracks en respectant la chaîne controller → service interface/impl → DTO → SecurityConfig. À utiliser dès qu'on touche à l'API Spring Boot (nouvelle route, nouveau champ exposé, changement de droits).
---

# Ajouter un endpoint

## Chaîne complète à respecter

Un endpoint touche systématiquement **4 endroits**. En oublier un est la source d'erreur la plus fréquente ici.

1. **DTO** — `dto/XxxRequest.java` / `dto/XxxResponse.java`
   Ne jamais exposer une entité `domain/` directement. Lombok `@Data @Builder`, annotations `@Schema` pour OpenAPI, validation `@NotBlank` / `@NotNull` / `@Size` sur les requêtes.

2. **Service** — interface dans `service/interfaces/XxxService.java`, implémentation dans `service/impl/XxxServiceImpl.java`
   Toute la logique métier vit ici, jamais dans le controller. Le mapping entité → DTO se fait dans l'impl.

3. **Controller** — `controller/XxxController.java`, `@RequestMapping("/api/...")`
   Signature attendue :
   ```java
   @PostMapping
   public ResponseEntity<ApiResponse<XxxResponse>> create(@Valid @RequestBody XxxRequest req) {
       return ResponseEntity.ok(ApiResponse.success(xxxService.create(req), "Créé"));
   }
   ```
   Ne jamais construire un status d'erreur à la main : lever `ResourceNotFoundException`, `BadRequestException` ou `ForbiddenException`, `GlobalExceptionHandler` produit la réponse.

4. **SecurityConfig** — `config/SecurityConfig.java`
   La règle par défaut est `.requestMatchers("/api/**").authenticated()`. **Un nouvel endpoint est donc protégé tant qu'il n'est pas déclaré `permitAll()` au-dessus de cette ligne.** Les routes publiques sont listées méthode par méthode :
   ```java
   .requestMatchers(HttpMethod.GET, "/api/xxx", "/api/xxx/*").permitAll()
   ```
   Les routes admin sont couvertes par `.requestMatchers("/api/admin/**").hasRole("ADMIN")`.

## Conventions

- Rôles : `user`, `premium_user`, `learner`, `admin` (enum `RoleName`). En Spring, `hasRole("ADMIN")` (majuscules, sans préfixe `ROLE_`).
- Enveloppe de réponse : toujours `ApiResponse<T>` (`success`, `message`, `data`, `timestamp`, `path`).
- Messages destinés à l'utilisateur : en français.
- Logging : `slf4j`, INFO pour les actions métier, DEBUG pour le détail technique. Ne jamais logger de token, mot de passe ou contenu de mail.
- Un endpoint qui lit/écrit un fichier passe par MinIO (`ImageAssetService`), pas par le disque local.

## Côté frontend
Un nouvel endpoint doit être appelé depuis `frontend/src/services/` uniquement :
- `publicApi.ts` si `permitAll`
- `api.ts` s'il exige un JWT
- `adminApi.ts` s'il est sous `/api/admin`

## Vérification
```
cd backend && ./mvnw test
```
Puis vérifier la route dans Swagger : `http://localhost:8080/swagger-ui.html`.
