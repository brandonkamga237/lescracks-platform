-- LesCracks — schema restructure.
--
-- Replaces the previous model (Keycloak-linked users, media, mentorship, applications,
-- participations, attestations, joined-inheritance resources) with the new one:
-- local users with passwords, admins, categories with slugs, resources with a
-- category and a status, articles with content blocks, ebooks backed by documents,
-- external video references, events with type/format/status, newsletter subscriptions
-- and password reset tokens.

-- ── Drop old tables (reverse dependency order) ────────────────────────────────
DROP TABLE IF EXISTS attestations CASCADE;
DROP TABLE IF EXISTS participations CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS resource_media CASCADE;
DROP TABLE IF EXISTS resource_tags CASCADE;
DROP TABLE IF EXISTS resource_articles CASCADE;
DROP TABLE IF EXISTS resource_ebooks CASCADE;
DROP TABLE IF EXISTS resource_videos CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS mentorship CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(120) NOT NULL,
    last_name     VARCHAR(120) NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED'))
);

CREATE INDEX users_email_idx ON users (LOWER(email));

-- ── Admins ────────────────────────────────────────────────────────────────────
CREATE TABLE admins (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(80)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT admins_status_check CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- ── Categories and tags ───────────────────────────────────────────────────────
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(80)  NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE tags (
    id          BIGSERIAL PRIMARY KEY,
    category_id BIGINT      NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    name        VARCHAR(60) NOT NULL,
    CONSTRAINT tags_name_per_category_unique UNIQUE (category_id, name)
);

-- ── Resources ─────────────────────────────────────────────────────────────────
CREATE TABLE resources (
    id          BIGSERIAL PRIMARY KEY,
    category_id BIGINT       NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    title       VARCHAR(200) NOT NULL,
    description TEXT         NOT NULL,
    cover_image VARCHAR(500) NOT NULL,
    status      VARCHAR(20)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT resources_status_check CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

CREATE INDEX resources_category_idx ON resources (category_id);
CREATE INDEX resources_status_idx ON resources (status);

CREATE TABLE resource_tags (
    resource_id BIGINT NOT NULL REFERENCES resources (id) ON DELETE CASCADE,
    tag_id      BIGINT NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (resource_id, tag_id)
);

-- ── Articles and content blocks ───────────────────────────────────────────────
CREATE TABLE articles (
    resource_id BIGINT PRIMARY KEY REFERENCES resources (id) ON DELETE CASCADE
);

CREATE TABLE content_blocks (
    id                  BIGSERIAL PRIMARY KEY,
    article_resource_id BIGINT      NOT NULL REFERENCES articles (resource_id) ON DELETE CASCADE,
    parent_id           BIGINT      REFERENCES content_blocks (id) ON DELETE CASCADE,
    type                VARCHAR(30) NOT NULL,
    position            INTEGER     NOT NULL,
    content             TEXT        NOT NULL,
    CONSTRAINT content_blocks_type_check CHECK (type IN ('PARAGRAPH', 'HEADING', 'IMAGE', 'QUOTE', 'CODE', 'LIST')),
    CONSTRAINT content_blocks_position_check CHECK (position >= 0),
    CONSTRAINT content_blocks_unique_position UNIQUE (article_resource_id, parent_id, position)
);

CREATE INDEX content_blocks_article_idx ON content_blocks (article_resource_id);

-- ── Documents, ebooks, external videos ────────────────────────────────────────
CREATE TABLE documents (
    id        BIGSERIAL PRIMARY KEY,
    file      VARCHAR(500) NOT NULL,
    format    VARCHAR(20)  NOT NULL,
    file_size BIGINT       NOT NULL,
    CONSTRAINT documents_size_check CHECK (file_size > 0)
);

CREATE TABLE ebooks (
    resource_id BIGINT PRIMARY KEY REFERENCES resources (id) ON DELETE CASCADE,
    document_id BIGINT NOT NULL UNIQUE REFERENCES documents (id) ON DELETE RESTRICT
);

CREATE TABLE external_video_references (
    resource_id BIGINT PRIMARY KEY REFERENCES resources (id) ON DELETE CASCADE,
    video_url   VARCHAR(1000) NOT NULL,
    platform    VARCHAR(50)   NOT NULL
);

-- ── Events ────────────────────────────────────────────────────────────────────
CREATE TABLE events (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT         NOT NULL,
    type        VARCHAR(30)  NOT NULL,
    format      VARCHAR(30)  NOT NULL,
    start_date  TIMESTAMPTZ  NOT NULL,
    end_date    TIMESTAMPTZ,
    location    VARCHAR(200),
    status      VARCHAR(20)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT events_type_check CHECK (type IN ('BOOTCAMP', 'WORKSHOP', 'WEBINAR', 'CONFERENCE')),
    CONSTRAINT events_format_check CHECK (format IN ('ONLINE', 'OFFLINE', 'HYBRID')),
    CONSTRAINT events_status_check CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED')),
    CONSTRAINT events_dates_check CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX events_type_idx ON events (type);
CREATE INDEX events_start_date_idx ON events (start_date DESC);
CREATE INDEX events_status_idx ON events (status);

-- ── Newsletter subscriptions ──────────────────────────────────────────────────
CREATE TABLE newsletter_subscriptions (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT      NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    status           VARCHAR(20) NOT NULL,
    subscribed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unsubscribed_at  TIMESTAMPTZ,
    CONSTRAINT newsletter_subscriptions_status_check CHECK (status IN ('SUBSCRIBED', 'UNSUBSCRIBED'))
);

-- ── Password reset tokens ─────────────────────────────────────────────────────
CREATE TABLE password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX password_reset_tokens_user_idx ON password_reset_tokens (user_id);