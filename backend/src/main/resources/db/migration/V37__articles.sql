-- Every resource is an article since V24: the two tables become one, owned by the content module.
-- Ids do not change, so comments, views and likes keep pointing at the right article.

-- Never used since block bodies moved into articles.body; it holds a foreign key to articles.
DROP TABLE IF EXISTS content_blocks;

ALTER TABLE resources
    ADD COLUMN body            JSONB,
    ADD COLUMN plain_text      TEXT,
    ADD COLUMN reading_minutes INTEGER NOT NULL DEFAULT 1;

UPDATE resources r
SET body = a.body, plain_text = a.plain_text, reading_minutes = a.reading_minutes
FROM articles a
WHERE a.resource_id = r.id;

UPDATE resources SET body = '[]'::jsonb WHERE body IS NULL;
ALTER TABLE resources ALTER COLUMN body SET NOT NULL;

DROP TABLE articles;
ALTER TABLE resources RENAME TO articles;
ALTER SEQUENCE resources_id_seq RENAME TO articles_id_seq;
ALTER TABLE articles ALTER COLUMN cover_image TYPE VARCHAR(1000);

ALTER INDEX IF EXISTS idx_resource_slug RENAME TO articles_slug_idx;
ALTER INDEX IF EXISTS idx_resources_scheduled_at RENAME TO articles_scheduled_at_idx;
ALTER INDEX IF EXISTS resources_category_idx RENAME TO articles_category_idx;
ALTER INDEX IF EXISTS resources_status_idx RENAME TO articles_status_idx;
-- The catalogue reads published articles newest first.
CREATE INDEX articles_catalogue_idx ON articles (status, (coalesce(published_at, created_at)) DESC);

ALTER TABLE resource_tags RENAME TO article_tags;
ALTER TABLE article_tags RENAME COLUMN resource_id TO article_id;
CREATE INDEX article_tags_tag_idx ON article_tags (tag_id);

-- Every article has had a slug since slugs were backfilled at startup; the column now says so.
UPDATE articles SET slug = 'article-' || id WHERE slug IS NULL OR slug = '';
ALTER TABLE articles ALTER COLUMN slug SET NOT NULL;
