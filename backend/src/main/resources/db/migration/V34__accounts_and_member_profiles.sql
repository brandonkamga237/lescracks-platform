-- users held two concerns: signing in (account) and the member's profile. They become two
-- tables owned by two modules. Ids do not change, so every foreign key to users keeps working.

ALTER TABLE users RENAME TO accounts;
ALTER SEQUENCE users_id_seq RENAME TO accounts_id_seq;
ALTER TABLE accounts RENAME CONSTRAINT users_status_check TO accounts_status_check;
ALTER INDEX users_email_idx RENAME TO accounts_email_lower_idx;
CREATE INDEX accounts_created_at_idx ON accounts (created_at DESC);
CREATE INDEX accounts_last_seen_at_idx ON accounts (last_seen_at);

-- One profile per member. Newsletter-only contacts (no password, no provider) are not members
-- and get none; a member without a row simply has an empty profile until they fill it.
CREATE TABLE member_profiles (
    account_id        BIGINT       PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
    username          VARCHAR(50)  UNIQUE,
    avatar_url        VARCHAR(1000),
    bio               TEXT,
    location          VARCHAR(100),
    social_links      JSONB        NOT NULL DEFAULT '{}'::jsonb,
    public_bio        BOOLEAN      NOT NULL DEFAULT FALSE,
    public_location   BOOLEAN      NOT NULL DEFAULT FALSE,
    public_links      BOOLEAN      NOT NULL DEFAULT FALSE,
    phone             VARCHAR(20),
    country           VARCHAR(2),
    situation         VARCHAR(30),
    goal              VARCHAR(30),
    marketing_consent BOOLEAN      NOT NULL DEFAULT FALSE,
    onboarded_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO member_profiles (account_id, username, avatar_url, bio, location, social_links,
                             public_bio, public_location, public_links, phone, country, situation, goal,
                             marketing_consent, onboarded_at, created_at, updated_at)
SELECT id, username, avatar_url, bio, location, social_links,
       public_bio, public_location, public_links, phone, country, situation, goal,
       marketing_consent, onboarded_at, created_at, updated_at
FROM accounts
WHERE password_hash IS NOT NULL OR provider <> 'LOCAL';

CREATE INDEX member_profiles_country_idx ON member_profiles (country);
CREATE INDEX member_profiles_onboarded_at_idx ON member_profiles (onboarded_at);

DROP INDEX IF EXISTS idx_users_country;
ALTER TABLE accounts
    DROP COLUMN username,
    DROP COLUMN avatar_url,
    DROP COLUMN bio,
    DROP COLUMN location,
    DROP COLUMN social_links,
    DROP COLUMN public_bio,
    DROP COLUMN public_location,
    DROP COLUMN public_links,
    DROP COLUMN phone,
    DROP COLUMN country,
    DROP COLUMN situation,
    DROP COLUMN goal,
    DROP COLUMN marketing_consent,
    DROP COLUMN onboarded_at;

-- Interests are part of the profile.
ALTER TABLE user_interests RENAME TO member_interests;
ALTER TABLE member_interests RENAME COLUMN user_id TO account_id;
CREATE INDEX member_interests_category_idx ON member_interests (category_id);

-- Google and GitHub links, with the instants made time-zone aware like everywhere else.
ALTER TABLE user_identities RENAME TO account_identities;
ALTER TABLE account_identities RENAME COLUMN user_id TO account_id;
ALTER INDEX idx_user_identities_user_id RENAME TO account_identities_account_idx;
ALTER TABLE account_identities RENAME CONSTRAINT uq_user_identities_provider_external_id TO account_identities_provider_external_id_key;
ALTER TABLE account_identities
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Email verification and password reset links were two copies of one table.
CREATE TABLE account_tokens (
    id         BIGSERIAL    PRIMARY KEY,
    account_id BIGINT       NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    purpose    VARCHAR(30)  NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ  NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT account_tokens_purpose_check CHECK (purpose IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'))
);
CREATE INDEX account_tokens_latest_idx ON account_tokens (account_id, purpose, created_at DESC);

INSERT INTO account_tokens (account_id, purpose, token_hash, expires_at, used_at, created_at)
SELECT user_id, 'EMAIL_VERIFICATION', token_hash, expires_at, used_at, created_at FROM email_verification_tokens;
INSERT INTO account_tokens (account_id, purpose, token_hash, expires_at, used_at, created_at)
SELECT user_id, 'PASSWORD_RESET', token_hash, expires_at, used_at, created_at FROM password_reset_tokens
ON CONFLICT (token_hash) DO NOTHING;

DROP TABLE email_verification_tokens;
DROP TABLE password_reset_tokens;

CREATE INDEX admins_username_lower_idx ON admins (lower(username));
