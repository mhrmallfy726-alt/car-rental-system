BEGIN;

ALTER TABLE advertisement_requests
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

ALTER TABLE advertisement_requests
  ADD COLUMN IF NOT EXISTS price_per_day NUMERIC(14, 2) NOT NULL DEFAULT 0;

ALTER TABLE advertisement_requests
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(14, 2) NOT NULL DEFAULT 0;

UPDATE advertisement_requests
SET ad_type = 'featured', status = 'cancelled'
WHERE ad_type = 'discount';

UPDATE advertisements
SET ad_type = 'featured', status = 'expired', updated_at = NOW()
WHERE ad_type = 'discount';

COMMIT;
