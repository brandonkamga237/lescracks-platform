-- ============================================================================
-- V8 — Give events a public SEO slug, so their URLs stop leaking the numeric PK.
--
-- Public event pages used /evenements/{id} (auto-increment id), which is
-- enumerable, leaks volume/growth, and reads poorly for SEO. Resources and
-- learners already carry a `slug`; events were the last entity still on raw ids.
--
-- This adds the column and backfills a slug for every existing row, matching the
-- app's slugify convention (lowercase, accents -> ascii, non-alphanumeric -> single
-- dash, trimmed) and numbering duplicates -2, -3, … exactly like the Java code.
-- The numeric id stays as the internal PK/FK; only the slug is exposed publicly.
-- ============================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Backfill: build a base slug from the title, then disambiguate duplicates with a
-- numeric suffix (first occurrence keeps the bare slug, the rest get -2, -3, …).
WITH base AS (
    SELECT
        id,
        COALESCE(
            NULLIF(
                trim(BOTH '-' FROM
                    regexp_replace(
                        translate(
                            lower(title),
                            'àáâãäåèéêëìíîïòóôõöùúûüç',
                            'aaaaaaeeeeiiiiooooouuuuc'
                        ),
                        '[^a-z0-9]+', '-', 'g'
                    )
                ),
                ''
            ),
            'evenement'
        ) AS base_slug
    FROM events
),
numbered AS (
    SELECT id, base_slug,
           row_number() OVER (PARTITION BY base_slug ORDER BY id) AS rn
    FROM base
)
UPDATE events e
SET slug = CASE WHEN n.rn = 1 THEN n.base_slug ELSE n.base_slug || '-' || n.rn END
FROM numbered n
WHERE e.id = n.id;

-- Enforce uniqueness (mirrors the entity's @Column(unique = true)). Multiple NULLs
-- are still allowed by Postgres, but every existing row has been backfilled above.
CREATE UNIQUE INDEX IF NOT EXISTS ux_events_slug ON events (slug);
