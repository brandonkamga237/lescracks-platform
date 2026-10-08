-- Scheduled publication: a draft with a scheduled_at in the past is published by the backend's scheduler.
ALTER TABLE resources ADD COLUMN scheduled_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN scheduled_at TIMESTAMPTZ;
ALTER TABLE cracklab_challenges ADD COLUMN scheduled_at TIMESTAMPTZ;

-- A resource written weeks ahead must surface as new on the day it goes out, not on the day it was drafted.
ALTER TABLE resources ADD COLUMN published_at TIMESTAMPTZ;
UPDATE resources SET published_at = created_at WHERE status = 'PUBLISHED';

CREATE INDEX idx_resources_scheduled_at ON resources (scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_events_scheduled_at ON events (scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_cracklab_challenges_scheduled_at ON cracklab_challenges (scheduled_at) WHERE scheduled_at IS NOT NULL;
