-- Who opened an article: one row per person, so a reload or a second tab never counts twice.
-- visitor_key is a hash of the member's email, or a random id kept by an anonymous browser.
CREATE TABLE resource_views (
    resource_id BIGINT      NOT NULL REFERENCES resources (id) ON DELETE CASCADE,
    visitor_key VARCHAR(80) NOT NULL,
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (resource_id, visitor_key)
);

-- Kept beside the article so the blog cards read the figure without counting rows for each one.
ALTER TABLE resources ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
