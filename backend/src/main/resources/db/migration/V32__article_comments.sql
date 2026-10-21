-- Comments under articles, published at once and moderated afterwards. A reply always hangs off
-- a top-level comment, so threads stay one level deep.
CREATE TABLE comments (
    id           BIGSERIAL     PRIMARY KEY,
    resource_id  BIGINT        NOT NULL REFERENCES resources (id) ON DELETE CASCADE,
    author_id    BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    parent_id    BIGINT        REFERENCES comments (id) ON DELETE CASCADE,
    body         VARCHAR(2000) NOT NULL,
    status       VARCHAR(20)   NOT NULL DEFAULT 'VISIBLE',
    -- Reports since the last admin review: the moderation queue reads it, three hide the comment.
    report_count INTEGER       NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    edited_at    TIMESTAMPTZ,
    CONSTRAINT comments_status_check CHECK (status IN ('VISIBLE', 'HIDDEN', 'DELETED'))
);

CREATE INDEX comments_resource_idx ON comments (resource_id, created_at);
CREATE INDEX comments_parent_idx ON comments (parent_id);
CREATE INDEX comments_author_idx ON comments (author_id, created_at);

-- One report per member and comment, kept after a review so the same people cannot report again.
CREATE TABLE comment_reports (
    comment_id  BIGINT       NOT NULL REFERENCES comments (id) ON DELETE CASCADE,
    reporter_id BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    reason      VARCHAR(300),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (comment_id, reporter_id)
);
