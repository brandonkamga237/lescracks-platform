-- Where a new member came from (WhatsApp, LinkedIn, Google, a campaign tag, or directly), so the
-- dashboard can tell which channel brings members and not only visits.
ALTER TABLE accounts ADD COLUMN signup_source VARCHAR(60);
