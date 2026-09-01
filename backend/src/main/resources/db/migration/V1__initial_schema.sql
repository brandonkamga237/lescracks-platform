-- LesCracks — initial schema.
--
-- The platform serves four intentions: attend a bootcamp or workshop, apply for the
-- Accompagnement 360, read a resource, and prove what you followed.
--
-- Three rules shape what follows.
--   A lookup table is for values an admin creates and renames. An enum column is for values
--   the code branches on.
--   No column is null by design. A field that only applies to one kind of row belongs in a
--   table for that kind, not in a shared one policed by a check constraint.
--   No absence carries meaning. A null foreign key means "not set", never "the other case".
--
-- Identity lives in Keycloak: no password, no provider, no role here.

-- ── Media ─────────────────────────────────────────────────────────────────────
-- Stores the object KEY, never a URL: a URL carries the location, so every row would break
-- the day the bucket or domain changes. Having them in one table is also what makes an
-- unreferenced image findable.
CREATE TABLE media (
    id            BIGSERIAL PRIMARY KEY,
    object_key    VARCHAR(255) NOT NULL UNIQUE,
    original_name VARCHAR(255) NOT NULL,
    content_type  VARCHAR(120) NOT NULL,
    size_bytes    BIGINT       NOT NULL,
    width         INTEGER,
    height        INTEGER,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT media_size_check CHECK (size_bytes > 0),
    CONSTRAINT media_dimensions_check CHECK ((width IS NULL) = (height IS NULL))
);

-- ── People ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id           BIGSERIAL PRIMARY KEY,
    subject      VARCHAR(64)  NOT NULL UNIQUE,
    email        VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    avatar_id    BIGINT       REFERENCES media (id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ
);

CREATE INDEX users_email_idx ON users (LOWER(email));

-- ── The Accompagnement 360 ────────────────────────────────────────────────────
-- One thing, permanently. It is not an event and shares nothing with one: it has no date,
-- no venue and no seats. It is open or it is closed, and that is the whole of its state —
-- when open, people may apply; when closed, they may not.
--
-- A single row, enforced rather than hoped for: the primary key can only ever be 1.
CREATE TABLE mentorship (
    id          SMALLINT     PRIMARY KEY DEFAULT 1,
    open        BOOLEAN      NOT NULL DEFAULT FALSE,
    title       VARCHAR(200) NOT NULL DEFAULT 'Accompagnement 360',
    summary     VARCHAR(500),
    description TEXT,
    cover_id    BIGINT       REFERENCES media (id) ON DELETE SET NULL,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT mentorship_single_row_check CHECK (id = 1)
);

INSERT INTO mentorship (id, open) VALUES (1, FALSE);

-- ── Events: bootcamps and workshops ───────────────────────────────────────────
-- Created one at a time, each with its own dates. Their lifecycle is read from those dates
-- rather than stored: a status column beside a date column describing the same thing drifts,
-- and the date is the fact.
CREATE TABLE events (
    id          BIGSERIAL PRIMARY KEY,
    kind        VARCHAR(20)  NOT NULL,
    slug        VARCHAR(160) NOT NULL UNIQUE,
    title       VARCHAR(200) NOT NULL,
    summary     VARCHAR(500),
    description TEXT,
    cover_id    BIGINT       REFERENCES media (id) ON DELETE SET NULL,
    starts_at   TIMESTAMPTZ  NOT NULL,
    ends_at     TIMESTAMPTZ,
    location    VARCHAR(200),
    capacity    INTEGER,
    published   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT events_kind_check CHECK (kind IN ('BOOTCAMP', 'WORKSHOP')),
    CONSTRAINT events_dates_check CHECK (ends_at IS NULL OR ends_at >= starts_at),
    CONSTRAINT events_capacity_check CHECK (capacity IS NULL OR capacity > 0)
);

CREATE INDEX events_kind_idx ON events (kind);
CREATE INDEX events_starts_at_idx ON events (starts_at DESC);
CREATE INDEX events_published_idx ON events (published) WHERE published;

-- ── Resources ─────────────────────────────────────────────────────────────────
CREATE TABLE categories (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE tags (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(60) NOT NULL,
    category_id BIGINT      NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    CONSTRAINT tags_name_per_category_unique UNIQUE (name, category_id)
);

-- What every resource has, whatever it is: an entry in the catalogue.
CREATE TABLE resources (
    id          BIGSERIAL PRIMARY KEY,
    kind        VARCHAR(20)  NOT NULL,
    slug        VARCHAR(160) NOT NULL UNIQUE,
    title       VARCHAR(200) NOT NULL,
    summary     VARCHAR(500),
    cover_id    BIGINT       REFERENCES media (id) ON DELETE SET NULL,
    category_id BIGINT       NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    view_count  BIGINT       NOT NULL DEFAULT 0,
    published   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT resources_kind_check CHECK (kind IN ('VIDEO', 'EBOOK', 'ARTICLE'))
);

CREATE INDEX resources_kind_idx ON resources (kind);
CREATE INDEX resources_category_idx ON resources (category_id);
CREATE INDEX resources_published_idx ON resources (published) WHERE published;

-- What only a video has: somewhere else to watch it.
CREATE TABLE resource_videos (
    resource_id  BIGINT PRIMARY KEY REFERENCES resources (id) ON DELETE CASCADE,
    external_url VARCHAR(1000) NOT NULL,
    duration_seconds INTEGER,
    CONSTRAINT resource_videos_duration_check CHECK (duration_seconds IS NULL OR duration_seconds > 0)
);

-- What only an ebook has: a file we hold.
CREATE TABLE resource_ebooks (
    resource_id   BIGINT PRIMARY KEY REFERENCES resources (id) ON DELETE CASCADE,
    file_key      VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type  VARCHAR(120) NOT NULL,
    size_bytes    BIGINT       NOT NULL,
    page_count    INTEGER,
    CONSTRAINT resource_ebooks_size_check CHECK (size_bytes > 0)
);

-- What only an article has: the document, and the prose drawn from it.
CREATE TABLE resource_articles (
    resource_id     BIGINT PRIMARY KEY REFERENCES resources (id) ON DELETE CASCADE,
    -- Typed blocks — paragraph, heading, image, quote, code — not a string of markup. That
    -- is what lets an editor offer tools, and what lets the rendering change later without
    -- rewriting what was written.
    body            JSONB        NOT NULL,
    -- The same article as plain text, written whenever the body is. Search and the SEO
    -- snapshot need prose; walking a block tree for either would be absurd.
    body_text       TEXT         NOT NULL,
    author_name     VARCHAR(120),
    reading_minutes INTEGER,
    CONSTRAINT resource_articles_reading_check CHECK (reading_minutes IS NULL OR reading_minutes > 0)
);

CREATE TABLE resource_tags (
    resource_id BIGINT NOT NULL REFERENCES resources (id) ON DELETE CASCADE,
    tag_id      BIGINT NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (resource_id, tag_id)
);

-- The images a resource shows, kept in step when a body is saved. RESTRICT is the point:
-- an image inside a published article cannot be deleted from under it.
CREATE TABLE resource_media (
    resource_id BIGINT NOT NULL REFERENCES resources (id) ON DELETE CASCADE,
    media_id    BIGINT NOT NULL REFERENCES media (id)     ON DELETE RESTRICT,
    PRIMARY KEY (resource_id, media_id)
);

CREATE INDEX resource_media_media_idx ON resource_media (media_id);

-- ── Applying, following, proving ──────────────────────────────────────────────
CREATE TABLE applications (
    id           BIGSERIAL PRIMARY KEY,
    -- What is being applied for, said outright rather than inferred from what is missing.
    target       VARCHAR(20)  NOT NULL,
    -- Set when and only when the target is an event; the check below enforces the pairing.
    event_id     BIGINT       REFERENCES events (id) ON DELETE CASCADE,
    -- Null while the applicant has no account: people apply first and register after.
    user_id      BIGINT       REFERENCES users (id) ON DELETE SET NULL,
    full_name    VARCHAR(160) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    phone        VARCHAR(40),
    motivation   TEXT,
    status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    decided_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT applications_target_check CHECK (target IN ('MENTORSHIP', 'EVENT')),
    CONSTRAINT applications_event_pairing_check CHECK ((target = 'EVENT') = (event_id IS NOT NULL)),
    CONSTRAINT applications_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    CONSTRAINT applications_decided_at_check CHECK ((status = 'PENDING') = (decided_at IS NULL))
);

CREATE INDEX applications_status_idx ON applications (status);
CREATE INDEX applications_event_idx ON applications (event_id);
-- One open request at a time: per event, and one for the mentorship. A rejected
-- application may be filed again.
CREATE UNIQUE INDEX applications_one_pending_event_idx
    ON applications (LOWER(email), event_id) WHERE status = 'PENDING' AND target = 'EVENT';
CREATE UNIQUE INDEX applications_one_pending_mentorship_idx
    ON applications (LOWER(email)) WHERE status = 'PENDING' AND target = 'MENTORSHIP';

CREATE TABLE participations (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    target         VARCHAR(20) NOT NULL,
    event_id       BIGINT      REFERENCES events (id) ON DELETE RESTRICT,
    application_id BIGINT      REFERENCES applications (id) ON DELETE SET NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    cohort         VARCHAR(100),
    started_at     DATE,
    completed_at   DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT participations_target_check CHECK (target IN ('MENTORSHIP', 'EVENT')),
    CONSTRAINT participations_event_pairing_check CHECK ((target = 'EVENT') = (event_id IS NOT NULL)),
    CONSTRAINT participations_status_check CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
    CONSTRAINT participations_completed_at_check CHECK ((status = 'COMPLETED') = (completed_at IS NOT NULL))
);

-- Not in the same thing twice at once. Following it again years later is a real thing,
-- so the constraint is on being under way, not on having ever been.
CREATE UNIQUE INDEX participations_one_active_event_idx
    ON participations (user_id, event_id) WHERE status = 'IN_PROGRESS' AND target = 'EVENT';
CREATE UNIQUE INDEX participations_one_active_mentorship_idx
    ON participations (user_id) WHERE status = 'IN_PROGRESS' AND target = 'MENTORSHIP';
CREATE INDEX participations_user_idx ON participations (user_id);
CREATE INDEX participations_status_idx ON participations (status);

CREATE TABLE attestations (
    id               BIGSERIAL PRIMARY KEY,
    participation_id BIGINT      NOT NULL UNIQUE REFERENCES participations (id) ON DELETE CASCADE,
    code             VARCHAR(32) NOT NULL UNIQUE,
    issued_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX attestations_code_idx ON attestations (code);
