-- ============================================================================
-- V4 — Likes and comments on resources.
--
-- Both require an account. An anonymous like is a number nobody can trust (one
-- person can inflate it forever), and an anonymous comment is a spam funnel.
-- Tying each to a user makes the signal real and moderation possible.
-- ============================================================================

-- ── Likes ───────────────────────────────────────────────────────────────────
-- No counter column on `resources`: the like count is COUNT(*) on this table.
-- A denormalised counter drifts the moment one write succeeds and the other fails,
-- and then nobody can say which number is the truth.
CREATE TABLE IF NOT EXISTS resource_likes (
    id          bigserial PRIMARY KEY,
    resource_id bigint    NOT NULL,
    user_id     bigint    NOT NULL,
    created_at  timestamp NOT NULL DEFAULT now(),

    CONSTRAINT fk_resource_likes_resource
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
    CONSTRAINT fk_resource_likes_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    -- One like per person per resource. Enforced by the DATABASE, not just by the
    -- service: a double-click that fires two requests must not create two rows.
    CONSTRAINT uq_resource_likes_user_resource UNIQUE (resource_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_likes_resource ON resource_likes (resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_likes_user     ON resource_likes (user_id);

-- ── Comments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resource_comments (
    id          bigserial PRIMARY KEY,
    resource_id bigint    NOT NULL,
    user_id     bigint    NOT NULL,
    content     text      NOT NULL,
    created_at  timestamp NOT NULL DEFAULT now(),
    updated_at  timestamp,

    CONSTRAINT fk_resource_comments_resource
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
    CONSTRAINT fk_resource_comments_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Comments are always read newest-first for one resource.
CREATE INDEX IF NOT EXISTS idx_resource_comments_resource
    ON resource_comments (resource_id, created_at DESC);
