-- Premium is removed from the product: no paid tier, no premium role, no restricted
-- resources. Videos are external links only, so nothing is hosted behind a paywall.

DROP TABLE IF EXISTS premium_requests;

UPDATE users u
SET role_id = (SELECT id FROM roles WHERE name = 'user')
FROM roles r
WHERE u.role_id = r.id
  AND r.name = 'premium_user';

DELETE FROM roles WHERE name = 'premium_user';

ALTER TABLE users DROP COLUMN IF EXISTS premium_activated_at;
ALTER TABLE users DROP COLUMN IF EXISTS premium_expires_at;
ALTER TABLE users DROP COLUMN IF EXISTS premium_contact_email;

ALTER TABLE resources DROP COLUMN IF EXISTS is_premium;

-- Videos that were uploaded have no player here any more; they keep their row so nothing
-- disappears from the catalogue, but they are marked external like every other video.
UPDATE resources r
SET source_type = 'EXTERNAL'
FROM resource_types t
WHERE r.resource_type_id = t.id
  AND t.name = 'video'
  AND r.source_type <> 'EXTERNAL';
