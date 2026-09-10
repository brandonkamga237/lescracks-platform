ALTER TABLE resources ADD COLUMN slug VARCHAR(220);
ALTER TABLE events ADD COLUMN slug VARCHAR(220);

CREATE INDEX idx_resource_slug ON resources(slug);
CREATE INDEX idx_event_slug ON events(slug);
