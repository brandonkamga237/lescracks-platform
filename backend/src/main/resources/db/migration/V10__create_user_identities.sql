-- External identities linked to a local user account.
-- One row per provider/user pair, so a user can sign in with email, Google and GitHub
-- and always land on the same profile.
CREATE TABLE user_identities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_identities_provider_external_id UNIQUE (provider, external_id)
);

CREATE INDEX idx_user_identities_user_id ON user_identities(user_id);
