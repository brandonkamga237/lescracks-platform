-- A member who asked to be reminded of a rendez-vous hears about it twice: the day before and
-- an hour before. One row per reminder sent, so the minute-by-minute job never sends it twice.
-- The primary key also serves as the index on registration_id.
CREATE TABLE event_reminders (
    registration_id BIGINT      NOT NULL REFERENCES event_registrations (id) ON DELETE CASCADE,
    moment          VARCHAR(20) NOT NULL,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT event_reminders_moment_check CHECK (moment IN ('DAY_BEFORE', 'HOUR_BEFORE')),
    PRIMARY KEY (registration_id, moment)
);
