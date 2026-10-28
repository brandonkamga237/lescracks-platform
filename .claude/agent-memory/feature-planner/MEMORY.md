# feature-planner memory

Decisions the maintainer took and traps for later plans. One line per fact.

## Decisions
- Module ownership beats convenience: the newsletter keeps its own copy of a member's name, kept in step by the `AccountRenamed` event, instead of reading `accounts` (2026-10)
- `docs/architecture/` was removed on purpose: do not plan documentation there (2026-10)
- CrackLab is gone for good (tables dropped in V41); old `/cracklab` links only redirect home
- `certificates.event_id` stays nullable without `NULLS NOT DISTINCT`: certificates of deleted events must survive

## Traps
- Removing rows that a cached counter counts needs an explicit correction step in the plan (see `AccountDeleting`)
- Public detail pages use numeric ids in the SPA but slugs in SEO snapshots and nginx
