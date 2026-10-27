# schema-keeper memory

Schema history worth knowing beyond the migrations themselves. One line per fact.

- Production was at V43 on 2026-10-27; V40–V43 applied in 0.3 s on that data size
- Old names survived renames: `users_pkey`, `resources_*` constraints, `user_identities_id_seq`, `newsletter_subscriptions_*`; harmless, but `DROP CONSTRAINT IF EXISTS` protects a migration against drift
- `talk_videos.status` has no CHECK yet, unlike every other status column
- Before a uniqueness migration, the maintainer ran a duplicates query on production; keep proposing it
