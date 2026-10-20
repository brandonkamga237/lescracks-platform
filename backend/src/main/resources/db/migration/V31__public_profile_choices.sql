-- What a member shows on their public profile beyond name, photo and badges. Everything starts
-- private: a member opens their city, bio or links themselves.
ALTER TABLE users
    ADD COLUMN public_bio      BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN public_location BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN public_links    BOOLEAN NOT NULL DEFAULT FALSE;
