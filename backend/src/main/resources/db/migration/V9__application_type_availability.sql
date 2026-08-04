-- Accompagnement 360 (and any application type) can be opened or closed by an admin.
-- Closing it stops new applications and lets the public pages show a clear message,
-- instead of silently accepting candidates the team isn't ready to process.
--
-- Column is named is_open (not "open") to steer clear of the SQL keyword. Default TRUE
-- keeps every existing type available exactly as before this migration.

ALTER TABLE application_types
    ADD COLUMN is_open BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN closed_message TEXT;
