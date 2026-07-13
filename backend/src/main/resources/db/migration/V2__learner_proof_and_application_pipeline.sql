-- ============================================================================
-- V2 — Turn a learner into a provable journey, and an application into a pipeline.
--
-- Why:
--   * A learner used to be a photo + a bio. It could not evidence anything:
--     no duration, no delivered work, no words from the person themselves.
--   * An application had three states (pending/accepted/rejected), which is a
--     three-faced boolean, not a funnel. You could not see where candidates drop.
--
-- Every statement is written to be safe to re-run.
-- ============================================================================

-- ── 1. Learner: the evidence fields ─────────────────────────────────────────
-- Real start/end dates let us compute an ACTUAL median duration instead of
-- claiming "6-12 months". A testimonial is only credible when it is attributable,
-- so it lives next to the learner's real name and photo.
ALTER TABLE learners ADD COLUMN IF NOT EXISTS started_at   date;
ALTER TABLE learners ADD COLUMN IF NOT EXISTS completed_at date;
ALTER TABLE learners ADD COLUMN IF NOT EXISTS testimonial  text;
ALTER TABLE learners ADD COLUMN IF NOT EXISTS github_url   varchar(255);

-- ── 2. Delivered projects — the part that cannot be faked ───────────────────
-- A link to running code is the only claim a reader can verify without trusting us.
CREATE TABLE IF NOT EXISTS learner_projects (
    id            bigserial PRIMARY KEY,
    learner_id    bigint       NOT NULL,
    title         varchar(180) NOT NULL,
    description   text,
    -- At least one of these should be present for the project to be worth showing.
    repo_url      varchar(500),   -- GitHub / GitLab
    live_url      varchar(500),   -- deployed app
    image_url     varchar(500),
    display_order integer      NOT NULL DEFAULT 0,
    created_at    timestamp    NOT NULL DEFAULT now(),
    CONSTRAINT fk_learner_projects_learner
        FOREIGN KEY (learner_id) REFERENCES learners (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_learner_projects_learner
    ON learner_projects (learner_id);

-- ── 3a. Unbreak the public application form ─────────────────────────────────
-- applications.user_id is NOT NULL in the live schema, but the public
-- "Accompagnement 360" form submits without an account (the entity already maps
-- it as nullable). Every public submission therefore died on a constraint
-- violation — which is why the applications table is empty.
--
-- Hibernate's ddl-auto:validate does not check nullability, so this never showed
-- up at startup: it only failed on the first real candidate.
ALTER TABLE applications ALTER COLUMN user_id DROP NOT NULL;

-- ── 3b. Applications: a real funnel ─────────────────────────────────────────
-- Status is persisted with EnumType.STRING, so existing rows carry the old
-- lowercase names. Map them onto the new pipeline before the app validates.
--
--   pending  -> RECEIVED   (it arrived, nobody has looked yet)
--   accepted -> ACCEPTED
--   rejected -> REJECTED
--
-- New intermediate stages (UNDER_REVIEW, INTERVIEW, STARTED, COMPLETED) are what
-- finally make drop-off visible.
-- Hibernate generated a CHECK constraint pinning status to the OLD enum values
-- ('pending','accepted','rejected'). Writing a new stage name violates it, so it
-- has to go before the data can move. We recreate it afterwards rather than drop
-- it for good: the database should keep refusing values the enum does not define.
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;

UPDATE applications SET status = 'RECEIVED' WHERE status = 'pending';
UPDATE applications SET status = 'ACCEPTED' WHERE status = 'accepted';
UPDATE applications SET status = 'REJECTED' WHERE status = 'rejected';

ALTER TABLE applications ADD CONSTRAINT applications_status_check
    CHECK (status IN (
        'RECEIVED', 'UNDER_REVIEW', 'INTERVIEW',
        'ACCEPTED', 'STARTED', 'COMPLETED', 'REJECTED'
    ));

-- Track when a candidate moved stage, so the funnel can show velocity, not just counts.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status_changed_at timestamp;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS admin_note        text;

UPDATE applications
   SET status_changed_at = COALESCE(status_changed_at, created_at, now())
 WHERE status_changed_at IS NULL;

-- ── 4. Drop the FORMATION event type ────────────────────────────────────────
-- Requested: LesCracks runs bootcamps, hackathons, meetups and workshops.
-- "Formation" overlapped with the Accompagnement 360 offer and muddied the model.
-- Guarded: only delete once nothing references it, so we can never orphan an event.
DELETE FROM event_types
 WHERE name = 'FORMATION'
   AND NOT EXISTS (
       SELECT 1 FROM events e
        WHERE e.event_type_id = event_types.id
   );
