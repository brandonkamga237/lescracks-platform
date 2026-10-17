-- The site keeps articles only. Ebooks and external videos go, with their likes and tags
-- (both cascade from resources). The ebook files themselves stay in MinIO: a migration cannot
-- reach object storage.
DELETE FROM resources
WHERE id IN (SELECT resource_id FROM ebooks UNION SELECT resource_id FROM external_video_references);

DROP TABLE ebooks;
DROP TABLE documents;
DROP TABLE external_video_references;
