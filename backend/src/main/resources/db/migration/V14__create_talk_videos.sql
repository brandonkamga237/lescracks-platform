-- Talk episodes: references to YouTube videos, not hosted files.
-- The thumbnail is derived from the YouTube URL, so no image is stored.
CREATE TABLE talk_videos (
    id                BIGSERIAL PRIMARY KEY,
    title             VARCHAR(200) NOT NULL,
    description       TEXT NOT NULL,
    guest             VARCHAR(160),
    youtube_url       VARCHAR(1000) NOT NULL,
    duration_minutes  INT,
    published_at      TIMESTAMPTZ,
    status            VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_talk_videos_status_published_at
    ON talk_videos (status, published_at DESC NULLS LAST);
