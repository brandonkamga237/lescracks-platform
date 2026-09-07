CREATE TABLE IF NOT EXISTS resource_likes (
    id           BIGSERIAL PRIMARY KEY,
    resource_id  BIGINT       NOT NULL REFERENCES resources (id) ON DELETE CASCADE,
    user_email   VARCHAR(120) NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_resource_likes_resource_user UNIQUE (resource_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_resource_likes_resource_id ON resource_likes (resource_id);
