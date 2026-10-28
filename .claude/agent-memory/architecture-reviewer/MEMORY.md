# architecture-reviewer memory

Index of what past reviews established. One line per fact; details in topic files beside this one.

## Known debt (do not report unless a change makes it worse)
- `stats/domain/StatsServiceImpl` is a Spring `@Service` that builds `stats/api/dto` records and calls `stats/infra/UmamiClient`: `stats` is not on the skeleton yet (target: `analytics`)
- `seo/api/SeoController` composes pages and JSON-LD itself (≈430 lines); `seo` has no application layer yet
- `mail` (target `notification`) and `community` are not on the skeleton
- HTTP payloads shared across modules: `member/api/dto` reuses `account/api/dto` (`IdentityResponse`, `SignupContext`); `community/api/dto` reuses `recognition/api/dto/MemberBadgeResponse`
- Services above the size thresholds: `CommentServiceImpl` (≈185 lines), `ArticleAdminServiceImpl` (8 collaborators), `CertificateServiceImpl` (7)

## Look for first
- A path that deletes rows a cached counter counts (`registration_count`, `engagement_counters`) without correcting the counter
- A new foreign key or filtered column without an index in the same migration
