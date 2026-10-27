-- event_submission_members repeats the project's event_id so that UNIQUE (event_id, user_id)
-- can keep a member in one team per event. The copy could disagree with the project it belongs
-- to; a composite foreign key now makes that impossible.
ALTER TABLE event_submissions ADD CONSTRAINT event_submissions_id_event_key UNIQUE (id, event_id);

ALTER TABLE event_submission_members DROP CONSTRAINT event_submission_members_submission_id_fkey;
ALTER TABLE event_submission_members ADD CONSTRAINT event_submission_members_submission_fkey
    FOREIGN KEY (submission_id, event_id) REFERENCES event_submissions (id, event_id) ON DELETE CASCADE;
