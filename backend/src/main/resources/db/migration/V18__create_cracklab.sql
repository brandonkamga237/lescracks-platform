-- CrackLab: engineering challenges that members answer and an admin grades against a rubric.

CREATE TABLE cracklab_challenges (
    id                 BIGSERIAL PRIMARY KEY,
    slug               VARCHAR(220)  NOT NULL UNIQUE,
    title              VARCHAR(200)  NOT NULL,
    category           VARCHAR(80)   NOT NULL,
    difficulty         VARCHAR(20)   NOT NULL,
    problem            TEXT          NOT NULL,
    constraints        TEXT,
    expected_format    VARCHAR(300),
    -- Enforced on submission; NULL means no limit.
    max_words          INTEGER CHECK (max_words IS NULL OR max_words > 0),
    -- Never sent to a member who has not submitted.
    reference_solution TEXT          NOT NULL,
    status             VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    created_by         VARCHAR(120)  NOT NULL,
    published_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_cracklab_challenges_status ON cracklab_challenges (status);

CREATE TABLE cracklab_challenge_tags (
    challenge_id BIGINT      NOT NULL REFERENCES cracklab_challenges (id) ON DELETE CASCADE,
    tag          VARCHAR(60) NOT NULL,
    PRIMARY KEY (challenge_id, tag)
);

CREATE TABLE cracklab_criteria (
    id           BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT       NOT NULL REFERENCES cracklab_challenges (id) ON DELETE CASCADE,
    label        VARCHAR(200) NOT NULL,
    max_points   INTEGER      NOT NULL CHECK (max_points > 0),
    position     INTEGER      NOT NULL
);

CREATE INDEX idx_cracklab_criteria_challenge ON cracklab_criteria (challenge_id);

CREATE TABLE cracklab_submissions (
    id              BIGSERIAL PRIMARY KEY,
    challenge_id    BIGINT       NOT NULL REFERENCES cracklab_challenges (id) ON DELETE CASCADE,
    user_id         BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    answer          TEXT         NOT NULL,
    -- NULL until graded; votes never write here.
    technical_score INTEGER,
    -- Sum of the votes, recomputed from cracklab_votes on every vote.
    vote_score      INTEGER      NOT NULL DEFAULT 0,
    status          VARCHAR(20)  NOT NULL DEFAULT 'SUBMITTED',
    graded_by       VARCHAR(120),
    graded_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_cracklab_submissions_challenge_user UNIQUE (challenge_id, user_id)
);

CREATE INDEX idx_cracklab_submissions_status ON cracklab_submissions (status);
CREATE INDEX idx_cracklab_submissions_user ON cracklab_submissions (user_id);

CREATE TABLE cracklab_evaluations (
    id            BIGSERIAL PRIMARY KEY,
    submission_id BIGINT  NOT NULL REFERENCES cracklab_submissions (id) ON DELETE CASCADE,
    criterion_id  BIGINT  NOT NULL REFERENCES cracklab_criteria (id) ON DELETE CASCADE,
    points        INTEGER NOT NULL CHECK (points >= 0),
    feedback      TEXT,
    CONSTRAINT uk_cracklab_evaluations_submission_criterion UNIQUE (submission_id, criterion_id)
);

CREATE TABLE cracklab_votes (
    id            BIGSERIAL PRIMARY KEY,
    submission_id BIGINT      NOT NULL REFERENCES cracklab_submissions (id) ON DELETE CASCADE,
    user_id       BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    value         SMALLINT    NOT NULL CHECK (value IN (-1, 1)),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_cracklab_votes_submission_user UNIQUE (submission_id, user_id)
);
