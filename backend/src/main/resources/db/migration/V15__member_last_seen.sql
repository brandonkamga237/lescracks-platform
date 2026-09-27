-- Last authenticated request per member; feeds the "active members" stats.
ALTER TABLE users
    ADD COLUMN last_seen_at TIMESTAMPTZ;
