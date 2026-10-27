---
name: db-migration
description: Change the LesCracks database schema through a Flyway migration. Use whenever a table, column or index is added, changed or removed, when a SQL adapter needs a new column, or when facing a "column/relation does not exist" or Flyway "checksum mismatch" error.
---

# Schema migration (Flyway)

## The core rule

**Flyway owns the schema in every environment. There is no ORM**: every adapter writes
its SQL through `JdbcClient` (`infra/persistence/JdbcXxxStore`), and nothing checks the
schema at startup. What proves that SQL and schema line up is the adapter's `*IT`, run by
`./mvnw verify` against PostgreSQL in Testcontainers (CI runs it on every PR).

## Procedure

1. Look up the highest number in `backend/src/main/resources/db/migration/`.
2. Create `V{n+1}__short_description.sql` (two underscores after the number,
   snake_case).
3. Write the DDL. The SQL dialect is PostgreSQL.
4. Index what the queries need: every new foreign key, and every column a frequent query
   filters, joins or sorts on, in the same migration (`CREATE INDEX … ON table (col)`).
   Use `TIMESTAMPTZ` for instants and the shapes listed in the design-patterns skill.
5. Update the `JdbcXxxStore` SQL and row mapper, and the `*IT` covering every statement.

Example:
```sql
-- V41__add_event_registration_deadline.sql
ALTER TABLE events ADD COLUMN registration_deadline TIMESTAMPTZ;
```

## Hard limits

- **Never edit a migration that is already merged into `develop` or `main`.** Flyway
  stores a checksum; any edit breaks startup on every database where it has been
  applied, production included. Fixing something means adding the next migration.
- Never renumber or delete an existing migration.
- Renaming a table or column: keep ids stable (`ALTER TABLE … RENAME`), so foreign keys
  survive — see V34, V35 and V37.

## Project specifics

- No baseline: V1 creates the database from nothing.
- For a **NOT NULL column added to a non-empty table**, do it in three steps inside
  the same migration: add the column nullable, backfill it (`UPDATE`), then
  `SET NOT NULL`.
- Reference data (themes, demo content) is inserted at startup by the seeders in
  `shared/bootstrap/`, and the first admin by `account/infra/bootstrap/AdminBootstrap`.

## Starting over (development only)
```
docker compose down -v && docker compose up -d
```
`-v` destroys the volumes and therefore the local data. Never in production.
