-- Who opened an event page: one row per person, so a reload or a second tab never counts twice.
-- visitor_key is a hash of the member's email, or a random id kept by an anonymous browser.
CREATE TABLE event_views (
    event_id    BIGINT      NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    visitor_key VARCHAR(80) NOT NULL,
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id, visitor_key)
);

-- Kept beside the event so lists read the figure without counting rows for every card.
ALTER TABLE events ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
