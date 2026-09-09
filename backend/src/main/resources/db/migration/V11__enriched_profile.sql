-- Enriched member profile fields.
ALTER TABLE users
    ADD COLUMN username VARCHAR(50) UNIQUE,
    ADD COLUMN avatar_url VARCHAR(255),
    ADD COLUMN bio TEXT,
    ADD COLUMN location VARCHAR(100),
    ADD COLUMN social_links JSONB NOT NULL DEFAULT '{}'::jsonb;
