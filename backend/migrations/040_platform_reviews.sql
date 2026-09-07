BEGIN;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS platform_rating INTEGER CHECK (platform_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS platform_comment TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_platform_rating
  ON reviews(platform_rating)
  WHERE platform_rating IS NOT NULL;

COMMIT;
