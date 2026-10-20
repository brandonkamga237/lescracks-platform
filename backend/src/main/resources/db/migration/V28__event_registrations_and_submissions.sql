-- Members sign up for events, and events such as hackathons collect projects on the platform.

-- Whether an event takes project submissions, how many people a project may name, and until when.
-- Without a deadline, the event's end closes submissions.
ALTER TABLE events
    ADD COLUMN accepts_submissions BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN max_team_size       INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN submission_deadline TIMESTAMPTZ,
    -- Kept beside the event so cards read it without counting rows.
    ADD COLUMN registration_count  INTEGER NOT NULL DEFAULT 0,
    ADD CONSTRAINT events_team_size_check CHECK (max_team_size BETWEEN 1 AND 4);

CREATE TABLE event_registrations (
    id         BIGSERIAL PRIMARY KEY,
    event_id   BIGINT      NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status     VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT event_registrations_status_check CHECK (status IN ('REGISTERED', 'CANCELLED', 'ATTENDED', 'ABSENT')),
    CONSTRAINT event_registrations_once UNIQUE (event_id, user_id)
);

CREATE TABLE event_submissions (
    id             BIGSERIAL PRIMARY KEY,
    event_id       BIGINT       NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    owner_id       BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title          VARCHAR(200) NOT NULL,
    repository_url VARCHAR(500) NOT NULL,
    demo_url       VARCHAR(500),
    description    TEXT         NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'SUBMITTED',
    score          INTEGER,
    rank           INTEGER,
    review_note    TEXT,
    submitted_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT event_submissions_status_check CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED')),
    CONSTRAINT event_submissions_score_check CHECK (score IS NULL OR score BETWEEN 0 AND 100),
    CONSTRAINT event_submissions_rank_check CHECK (rank IS NULL OR rank BETWEEN 1 AND 10)
);

-- Everyone named on a project, the owner included. event_id is repeated here so the database
-- itself refuses one person on two projects of the same event, whatever the caller does.
CREATE TABLE event_submission_members (
    submission_id BIGINT NOT NULL REFERENCES event_submissions (id) ON DELETE CASCADE,
    event_id      BIGINT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    user_id       BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    PRIMARY KEY (submission_id, user_id),
    CONSTRAINT event_submission_members_once UNIQUE (event_id, user_id)
);

CREATE INDEX event_submissions_event_idx ON event_submissions (event_id);
