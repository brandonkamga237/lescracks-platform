-- Articles are written in the admin back office, so their content lives in the row
-- itself instead of an external link or a MinIO object.

ALTER TABLE resource_types DROP CONSTRAINT IF EXISTS resource_types_name_check;
ALTER TABLE resource_types ADD CONSTRAINT resource_types_name_check
    CHECK (name IN ('video', 'document', 'article'));

INSERT INTO resource_types (name)
SELECT 'article'
WHERE NOT EXISTS (SELECT 1 FROM resource_types WHERE name = 'article');

ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_source_type_check;
ALTER TABLE resources ADD CONSTRAINT resources_source_type_check
    CHECK (source_type IN ('EXTERNAL', 'UPLOADED', 'INLINE'));

ALTER TABLE resources ALTER COLUMN url DROP NOT NULL;
ALTER TABLE resources ADD COLUMN content TEXT;

-- An external link and an uploaded file both need a url; an article needs its body.
ALTER TABLE resources ADD CONSTRAINT resources_content_or_url_check CHECK (
    (source_type IN ('EXTERNAL', 'UPLOADED') AND url IS NOT NULL)
    OR (source_type = 'INLINE' AND content IS NOT NULL)
);

ALTER TABLE resource_metadata ADD COLUMN reading_time_minutes INTEGER;
ALTER TABLE resource_metadata ADD COLUMN author CHARACTER VARYING(255);

-- Uploaded videos are reserved for premium members.
UPDATE resources r
SET is_premium = TRUE
FROM resource_types t
WHERE r.resource_type_id = t.id
  AND t.name = 'video'
  AND r.source_type = 'UPLOADED'
  AND r.is_premium = FALSE;
