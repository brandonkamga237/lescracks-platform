-- A campaign now stores the block document the admin wrote, not rendered HTML:
-- 10k characters of varchar is not enough headroom for a JSON body.
ALTER TABLE newsletter_campaigns ALTER COLUMN message TYPE TEXT;
