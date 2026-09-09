-- Inline article content, linked one-to-one with a resource.
CREATE TABLE articles (
    resource_id     BIGINT PRIMARY KEY REFERENCES resources (id) ON DELETE CASCADE,
    body            JSONB NOT NULL,
    plain_text      TEXT,
    reading_minutes INT NOT NULL DEFAULT 1
);
