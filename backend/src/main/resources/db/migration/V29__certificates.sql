-- Attestations: prepared as drafts from an event's participants, issued by the admin one batch at a
-- time, and checkable by anyone with their code. Name, wording and date are frozen in the row so an
-- issued attestation never changes when a profile or an event is edited later.
CREATE TABLE certificates (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(16)  NOT NULL UNIQUE,
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    event_id    BIGINT       REFERENCES events (id) ON DELETE SET NULL,
    kind        VARCHAR(20)  NOT NULL,
    holder_name VARCHAR(200) NOT NULL,
    title       VARCHAR(300) NOT NULL,
    detail      VARCHAR(300),
    event_date  TIMESTAMPTZ,
    status      VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    issued_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT certificates_kind_check CHECK (kind IN ('PARTICIPATION', 'WINNER', 'PODIUM', 'AMBASSADOR')),
    CONSTRAINT certificates_status_check CHECK (status IN ('DRAFT', 'ISSUED', 'REVOKED')),
    -- One attestation of a kind per person and event; preparing drafts twice adds nothing.
    CONSTRAINT certificates_once UNIQUE (user_id, event_id, kind)
);

CREATE INDEX certificates_event_idx ON certificates (event_id);
CREATE INDEX certificates_user_idx ON certificates (user_id);
