-- Each subscription carries a random token. It goes into every newsletter email so a reader can
-- unsubscribe in one click, from the link or from their mail client, without signing in.
ALTER TABLE newsletter_subscriptions ADD COLUMN token VARCHAR(64);
UPDATE newsletter_subscriptions
SET token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
ALTER TABLE newsletter_subscriptions ALTER COLUMN token SET NOT NULL;
ALTER TABLE newsletter_subscriptions ADD CONSTRAINT newsletter_subscriptions_token_key UNIQUE (token);
