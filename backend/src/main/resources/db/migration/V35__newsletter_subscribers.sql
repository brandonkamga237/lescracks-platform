-- The newsletter keeps its own audience: an address, a name, and the account behind it when there
-- is one. Newsletter-only contacts were accounts nobody could sign in with; they stop being accounts.

ALTER TABLE newsletter_subscriptions RENAME TO newsletter_subscribers;
ALTER TABLE newsletter_subscribers RENAME COLUMN user_id TO account_id;
ALTER TABLE newsletter_subscribers ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE newsletter_subscribers
    ADD COLUMN email      VARCHAR(255),
    ADD COLUMN first_name VARCHAR(120),
    ADD COLUMN last_name  VARCHAR(120);

UPDATE newsletter_subscribers s
SET email = lower(a.email), first_name = a.first_name, last_name = a.last_name
FROM accounts a
WHERE a.id = s.account_id;

UPDATE newsletter_subscribers s
SET account_id = NULL
FROM accounts a
WHERE a.id = s.account_id AND a.password_hash IS NULL AND a.provider = 'LOCAL';

DELETE FROM accounts WHERE password_hash IS NULL AND provider = 'LOCAL';

-- Two rows for one address could only come from emails differing by case; the oldest stays.
DELETE FROM newsletter_subscribers s
USING newsletter_subscribers t
WHERE lower(s.email) = lower(t.email) AND s.id > t.id;

ALTER TABLE newsletter_subscribers ALTER COLUMN email SET NOT NULL;
CREATE UNIQUE INDEX newsletter_subscribers_email_key ON newsletter_subscribers (lower(email));
CREATE INDEX newsletter_subscribers_status_idx ON newsletter_subscribers (status);
CREATE INDEX newsletter_subscribers_subscribed_at_idx ON newsletter_subscribers (subscribed_at);

ALTER TABLE newsletter_campaigns
    ALTER COLUMN sent_at TYPE TIMESTAMPTZ USING sent_at AT TIME ZONE 'UTC';
