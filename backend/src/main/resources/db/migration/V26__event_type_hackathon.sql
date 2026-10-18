-- Hackathons join the event types: a coding challenge over several days, submitted from outside the platform.
ALTER TABLE events DROP CONSTRAINT events_type_check;
ALTER TABLE events ADD CONSTRAINT events_type_check
    CHECK (type IN ('BOOTCAMP', 'WORKSHOP', 'WEBINAR', 'CONFERENCE', 'HACKATHON'));
