-- ============================================================================
-- V5 — Make a password change actually end every session.
--
-- Resetting a password used to do two things: set the new password, mark the token
-- used. That's it. Any session already open stayed open.
--
-- So the one scenario people reset their password FOR — "someone stole my session,
-- let me lock them out" — was exactly the scenario it did not cover. The attacker's
-- cookie kept working until it expired on its own.
--
-- Tokens are stateless, so we cannot go and delete them: we don't have a list. But
-- every JWT carries the instant it was issued (iat). Recording WHEN the credentials
-- last changed lets the filter reject anything older, which kills every outstanding
-- session in one write, without ever enumerating them.
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS credentials_changed_at timestamp;

-- Existing sessions are not retroactively killed: leaving this NULL means "no cut-off
-- yet", so nobody is logged out simply because we deployed this.
