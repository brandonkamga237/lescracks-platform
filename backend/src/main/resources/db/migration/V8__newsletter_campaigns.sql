CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id BIGSERIAL PRIMARY KEY,
    subject VARCHAR(200) NOT NULL,
    message VARCHAR(10000) NOT NULL,
    recipient_count INTEGER NOT NULL,
    sent_at TIMESTAMP NOT NULL
);
