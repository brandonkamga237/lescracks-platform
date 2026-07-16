-- ============================================================================
-- V7 — Drop the vestigial premium_requests.status column.
--
-- The status field was removed from the PremiumRequest entity ("a request is
-- pending by definition — accepted requests are deleted, not flagged"), but the
-- NOT NULL column stayed behind in the schema. So every insert died on a
-- not-null violation, and NOBODY could ever submit a premium request. Hibernate's
-- validate doesn't check nullability, so it never surfaced at startup — only when
-- a real user tried to upgrade.
--
-- Same failure shape as applications.user_id in V2: a column the entity no longer
-- writes, still marked NOT NULL. Drop it.
-- ============================================================================

ALTER TABLE premium_requests DROP COLUMN IF EXISTS status;
