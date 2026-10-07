-- Optional cover chosen by the admin; without one the YouTube thumbnail is still used.
ALTER TABLE talk_videos ADD COLUMN IF NOT EXISTS cover_image VARCHAR(1000);
