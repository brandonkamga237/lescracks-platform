-- A sign-up from the public form waits in PENDING until its address confirms it (double opt-in).
ALTER TABLE newsletter_subscriptions DROP CONSTRAINT newsletter_subscriptions_status_check;
ALTER TABLE newsletter_subscriptions ADD CONSTRAINT newsletter_subscriptions_status_check
    CHECK (status IN ('PENDING', 'SUBSCRIBED', 'UNSUBSCRIBED'));
