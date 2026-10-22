-- Events move to plain SQL. Every event has had a slug since slugs were backfilled at startup;
-- the column now says so, and the startup backfill goes away.
UPDATE events SET slug = 'evenement-' || id WHERE slug IS NULL OR slug = '';
ALTER TABLE events ALTER COLUMN slug SET NOT NULL;

-- Listings read published events by date; a member's account lists their registrations.
CREATE INDEX events_catalogue_idx ON events (status, start_date);
CREATE INDEX event_registrations_user_idx ON event_registrations (user_id);
