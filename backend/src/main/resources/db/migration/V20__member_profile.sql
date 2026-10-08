-- What a member tells us about themselves, asked once after sign-up and then through the profile gauge.
ALTER TABLE users
    ADD COLUMN phone             VARCHAR(20),
    ADD COLUMN country           VARCHAR(2),
    ADD COLUMN situation         VARCHAR(30),
    ADD COLUMN goal              VARCHAR(30),
    ADD COLUMN marketing_consent BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Set when the welcome questions were answered or put off; null means they are still to be shown.
    ADD COLUMN onboarded_at      TIMESTAMPTZ,
    ADD COLUMN signup_path       VARCHAR(255),
    ADD COLUMN signup_language   VARCHAR(20),
    ADD COLUMN signup_timezone   VARCHAR(64);

CREATE TABLE user_interests (
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, category_id)
);

CREATE INDEX idx_users_country ON users (country);
