-- Inline article content, linked one-to-one with a resource.
-- articles already exists as a V2 stub in every migrated database: enrich it
-- idempotently so fresh installs and partially applied histories both converge.
CREATE TABLE IF NOT EXISTS articles (
    resource_id BIGINT PRIMARY KEY REFERENCES resources (id) ON DELETE CASCADE
);

ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS body            JSONB,
    ADD COLUMN IF NOT EXISTS plain_text      TEXT,
    ADD COLUMN IF NOT EXISTS reading_minutes INT NOT NULL DEFAULT 1;

UPDATE articles SET body = '[]'::jsonb WHERE body IS NULL;
ALTER TABLE articles ALTER COLUMN body SET NOT NULL;
