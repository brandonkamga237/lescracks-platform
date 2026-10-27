-- A member's projects are listed by user_id alone: the unique (event_id, user_id) index
-- cannot serve that lookup, so every profile and activity sheet scanned the table.
CREATE INDEX event_submission_members_user_idx ON event_submission_members (user_id);

-- Foreign keys with ON DELETE CASCADE from accounts: without an index, deleting an account
-- scans each table to find the rows to remove.
CREATE INDEX event_submissions_owner_idx ON event_submissions (owner_id);
CREATE INDEX comment_reports_reporter_idx ON comment_reports (reporter_id);
