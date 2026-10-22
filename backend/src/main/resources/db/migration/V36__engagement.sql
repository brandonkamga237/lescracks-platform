-- Views, likes and comments were one table per kind of content. They become one table each for
-- any target (article, event, talk), owned by the engagement module, with the figures cards show
-- kept in engagement_counters so a list reads them in one query.

CREATE TABLE content_views (
    target_type VARCHAR(20) NOT NULL,
    target_id   BIGINT      NOT NULL,
    visitor_key VARCHAR(80) NOT NULL,
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (target_type, target_id, visitor_key),
    CONSTRAINT content_views_target_check CHECK (target_type IN ('ARTICLE', 'EVENT', 'TALK'))
);

INSERT INTO content_views (target_type, target_id, visitor_key, viewed_at)
SELECT 'ARTICLE', resource_id, visitor_key, viewed_at FROM resource_views;
INSERT INTO content_views (target_type, target_id, visitor_key, viewed_at)
SELECT 'EVENT', event_id, visitor_key, viewed_at FROM event_views;

-- Likes were keyed by email; they follow the account now, and leave with it.
CREATE TABLE content_likes (
    target_type VARCHAR(20) NOT NULL,
    target_id   BIGINT      NOT NULL,
    account_id  BIGINT      NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (target_type, target_id, account_id),
    CONSTRAINT content_likes_target_check CHECK (target_type IN ('ARTICLE', 'EVENT', 'TALK'))
);
CREATE INDEX content_likes_account_idx ON content_likes (account_id);

INSERT INTO content_likes (target_type, target_id, account_id, created_at)
SELECT 'ARTICLE', l.resource_id, a.id, l.created_at
FROM resource_likes l
JOIN accounts a ON lower(a.email) = lower(l.user_email)
ON CONFLICT DO NOTHING;

CREATE TABLE engagement_counters (
    target_type VARCHAR(20) NOT NULL,
    target_id   BIGINT      NOT NULL,
    view_count  INTEGER     NOT NULL DEFAULT 0,
    like_count  INTEGER     NOT NULL DEFAULT 0,
    PRIMARY KEY (target_type, target_id),
    CONSTRAINT engagement_counters_target_check CHECK (target_type IN ('ARTICLE', 'EVENT', 'TALK'))
);

INSERT INTO engagement_counters (target_type, target_id, view_count)
SELECT target_type, target_id, count(*) FROM content_views GROUP BY target_type, target_id;
INSERT INTO engagement_counters (target_type, target_id, like_count)
SELECT target_type, target_id, count(*) FROM content_likes GROUP BY target_type, target_id
ON CONFLICT (target_type, target_id) DO UPDATE SET like_count = EXCLUDED.like_count;

DROP TABLE resource_views;
DROP TABLE event_views;
DROP TABLE resource_likes;
ALTER TABLE resources DROP COLUMN view_count;
ALTER TABLE events DROP COLUMN view_count;

-- Comments name their target instead of an article.
ALTER TABLE comments DROP CONSTRAINT comments_resource_id_fkey;
ALTER TABLE comments RENAME COLUMN resource_id TO target_id;
ALTER TABLE comments ADD COLUMN target_type VARCHAR(20) NOT NULL DEFAULT 'ARTICLE';
ALTER TABLE comments ALTER COLUMN target_type DROP DEFAULT;
ALTER TABLE comments ADD CONSTRAINT comments_target_check CHECK (target_type IN ('ARTICLE', 'EVENT', 'TALK'));
DROP INDEX comments_resource_idx;
CREATE INDEX comments_target_idx ON comments (target_type, target_id, created_at);
CREATE INDEX comments_moderation_idx ON comments (report_count, created_at) WHERE status <> 'DELETED';
CREATE INDEX comment_reports_comment_idx ON comment_reports (comment_id, created_at);
