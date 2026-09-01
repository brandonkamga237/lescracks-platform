---
name: db-migration
description: Change the LesCracks database schema through a Flyway migration. Use whenever a field or JPA entity is added, changed or removed, or when facing a Hibernate "Schema-validation" or Flyway "checksum mismatch" error.
---

# Schema migration (Flyway)

## The core rule

**Flyway owns the schema in every environment. Hibernate runs with
`ddl-auto: validate` and never creates anything.**

The direct consequence: adding a field to a `domain/` entity without the matching
migration makes the application **fail to start** — in development as well as in
production. That is not a bug, it is the safety net.

## Procedure

1. Look up the highest number in `backend/src/main/resources/db/migration/`.
2. Create `V{n+1}__short_description.sql` (two underscores after the number,
   snake_case).
3. Write the DDL. The SQL dialect is PostgreSQL.
4. Change the JPA entity to match — the two must line up exactly (column name,
   nullability, type).
5. Restart the backend: if it starts, Hibernate validation passed.

Example:
```sql
-- V10__add_event_registration_deadline.sql
ALTER TABLE events ADD COLUMN registration_deadline TIMESTAMP;
```

## Hard limits

- **Never edit a migration that is already merged into `develop` or `main`.** Flyway
  stores a checksum; any edit breaks startup on every database where it has been
  applied, production included. Fixing something means adding the next migration.
- Never renumber or delete an existing migration.
- Never switch `ddl-auto` to `update` to work around a validation error.

## Project specifics

- `baseline-on-migrate: true` with `baseline-version: 1`:
  `V1__baseline_existing_schema.sql` is a dump of the pre-existing schema and never
  replays against a database that already has it.
- In production, `SPRING_DDL_AUTO` (in `.env`) may be `update` for the first
  deployment; the target value is `validate`.
- For a **NOT NULL column added to a non-empty table**, do it in three steps inside
  the same migration: add the column nullable, backfill it (`UPDATE`), then
  `SET NOT NULL`.
- Reference data (roles, `ApplicationType`, `ResourceType`) is inserted at startup by
  `config/DataInitializer.java`, not by a migration. A new enum value has to be
  declared in both places: the Java enum and the `DataInitializer`.

## Starting over (development only)
```
docker compose down -v && docker compose up -d
```
`-v` destroys the volumes and therefore the local data. Never in production.
