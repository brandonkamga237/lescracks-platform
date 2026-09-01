---
name: db-migration
description: Modifier le schéma de base LesCracks via une migration Flyway. À utiliser dès qu'on ajoute/modifie/supprime un champ ou une entité JPA, ou face à une erreur Hibernate "Schema-validation" ou Flyway "checksum mismatch".
---

# Migration de schéma (Flyway)

## Règle fondamentale

**Flyway est propriétaire du schéma dans tous les environnements. Hibernate est en `ddl-auto: validate` et ne crée jamais rien.**

Conséquence directe : ajouter un champ à une entité `domain/` sans migration correspondante fait **échouer le démarrage** de l'application — en dev comme en prod. Ce n'est pas un bug, c'est le garde-fou.

## Procédure

1. Regarder le dernier numéro présent dans `backend/src/main/resources/db/migration/`.
2. Créer `V{n+1}__description_courte.sql` (deux underscores après le numéro, snake_case).
3. Écrire le DDL. Le SQL est du PostgreSQL.
4. Modifier l'entité JPA en conséquence — les deux doivent correspondre exactement (nom de colonne, nullabilité, type).
5. Redémarrer le backend : s'il démarre, la validation Hibernate est passée.

Exemple :
```sql
-- V10__add_event_registration_deadline.sql
ALTER TABLE events ADD COLUMN registration_deadline TIMESTAMP;
```

## Interdits absolus

- **Ne jamais modifier une migration déjà mergée sur `develop` ou `main`.** Flyway stocke un checksum ; toute édition casse le démarrage sur les bases où elle est déjà appliquée (dont la prod). Corriger = créer une migration suivante.
- Ne jamais renuméroter ni supprimer une migration existante.
- Ne pas passer `ddl-auto` à `update` pour contourner une erreur de validation.

## Points spécifiques au projet

- `baseline-on-migrate: true` avec `baseline-version: 1` : `V1__baseline_existing_schema.sql` est le dump du schéma préexistant, il ne se rejoue jamais sur une base déjà en place.
- En prod, `SPRING_DDL_AUTO` (dans `.env`) peut valoir `update` au premier déploiement ; la valeur cible est `validate`.
- Sur une **colonne NOT NULL ajoutée à une table non vide**, faire en trois temps dans la même migration : ajouter la colonne nullable, remplir (`UPDATE`), puis `SET NOT NULL`.
- Les données de référence (rôles, `ApplicationType`, `ResourceType`) sont insérées au démarrage par `config/DataInitializer.java`, pas par migration. Un nouveau type d'enum se déclare aux deux endroits : l'enum Java et le `DataInitializer`.

## Repartir de zéro (dev uniquement)
```
docker compose down -v && docker compose up -d
```
`-v` détruit les volumes et donc les données locales. Jamais en prod.
