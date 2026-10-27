-- Every lookup compares lower(email) and lower(username), but uniqueness was only enforced on
-- the exact spelling: Jean@x.com and jean@x.com could both exist. One rule now, in the database.
-- If this fails on "could not create unique index", list the clashes with
--   SELECT lower(email), array_agg(id) FROM accounts GROUP BY 1 HAVING count(*) > 1;
-- and merge or remove them first.
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS users_email_key;
DROP INDEX IF EXISTS accounts_email_lower_idx;
CREATE UNIQUE INDEX accounts_email_lower_key ON accounts (lower(email));

ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_username_key;
DROP INDEX IF EXISTS admins_username_lower_idx;
CREATE UNIQUE INDEX admins_username_lower_key ON admins (lower(username));
