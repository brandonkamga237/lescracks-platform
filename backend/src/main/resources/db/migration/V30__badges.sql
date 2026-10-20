-- Profile badges. System badges are awarded by rules (an attestation issued) and cannot be edited
-- or deleted; the admin creates custom ones and awards any badge by hand.
CREATE TABLE badges (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(60)  NOT NULL UNIQUE,
    name        VARCHAR(80)  NOT NULL,
    description VARCHAR(300) NOT NULL,
    icon        VARCHAR(40)  NOT NULL DEFAULT 'award',
    system      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE member_badges (
    id         BIGSERIAL PRIMARY KEY,
    badge_id   BIGINT       NOT NULL REFERENCES badges (id) ON DELETE CASCADE,
    user_id    BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    reason     VARCHAR(300),
    awarded_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT member_badges_once UNIQUE (badge_id, user_id)
);

CREATE INDEX member_badges_user_idx ON member_badges (user_id);

INSERT INTO badges (code, name, description, icon, system) VALUES
    ('EVENT_PARTICIPANT', 'Présent', 'A participé à un événement LesCracks.', 'calendar-check', TRUE),
    ('HACKATHON_PARTICIPANT', 'Hackathonien', 'A rendu un projet à un hackathon LesCracks.', 'code', TRUE),
    ('HACKATHON_PODIUM', 'Podium', 'S’est classé sur le podium d’un hackathon LesCracks.', 'medal', TRUE),
    ('HACKATHON_WINNER', 'Lauréat', 'A remporté un hackathon LesCracks.', 'trophy', TRUE),
    ('FOUNDING_MEMBER', 'Membre fondateur', 'Parmi les 500 premiers membres de LesCracks.', 'sparkles', TRUE);

-- The first 500 members (accounts, not newsletter-only contacts) start with the founding badge.
INSERT INTO member_badges (badge_id, user_id, reason, awarded_at)
SELECT (SELECT id FROM badges WHERE code = 'FOUNDING_MEMBER'), u.id, 'Parmi les premiers membres', now()
FROM (
    SELECT id FROM users
    WHERE password_hash IS NOT NULL OR provider <> 'LOCAL'
    ORDER BY created_at, id
    LIMIT 500
) u;
