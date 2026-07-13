-- ============================================================================
-- V3 — Give events a real capacity.
--
-- The frontend already rendered "12/20 participants", a "Complet" state and an
-- urgency flame — against fields the API never returned and the database never
-- had. The whole capacity UI was decorative: guarded by `maxParticipants &&`, it
-- simply never appeared, and EventRequest rejected the field outright.
--
-- Only the ceiling is stored. The number of people currently registered is DERIVED
-- from the applications table, so it can never drift out of sync with reality the
-- way a denormalised counter does.
-- ============================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS max_participants integer;

-- Counting registrations per event is now on the hot path of the events list.
CREATE INDEX IF NOT EXISTS idx_applications_event ON applications (event_id);
