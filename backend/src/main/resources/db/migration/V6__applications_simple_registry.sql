-- ============================================================================
-- V6 — Applications become a simple registry, not a pipeline.
--
-- V2 gave applications a seven-stage funnel (RECEIVED → UNDER_REVIEW → INTERVIEW
-- → ACCEPTED → STARTED → COMPLETED, plus REJECTED). For an Accompagnement 360
-- candidate list that is overkill: what's actually wanted is to LIST people and,
-- at will, archive or delete them. Nothing more.
--
-- So the status machinery is removed. An application is now either active
-- (archived_at IS NULL) or archived. The 360-vs-event separation is unchanged and
-- carried by event_id: NULL = a 360 application, set = an event registration.
--
-- Two real 360 candidates already exist in production. They are RECEIVED today and
-- must stay ACTIVE (archived_at NULL) — this migration never touches them.
-- ============================================================================

ALTER TABLE applications ADD COLUMN IF NOT EXISTS archived_at timestamp;

-- Preserve intent: an application that had been REJECTED is effectively "set aside",
-- so it lands in the archive. Everything else stays active. (No effect in prod today,
-- where both rows are RECEIVED.)
UPDATE applications
   SET archived_at = COALESCE(status_changed_at, created_at, now())
 WHERE status = 'REJECTED'
   AND archived_at IS NULL;

-- Tear down the funnel. Drop the CHECK first, or dropping the column it guards fails.
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications DROP COLUMN IF EXISTS status;
ALTER TABLE applications DROP COLUMN IF EXISTS status_changed_at;
