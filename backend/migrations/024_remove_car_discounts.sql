BEGIN;

-- Existing vehicles no longer support discounts.
UPDATE cars
SET discount_percentage = 0
WHERE COALESCE(discount_percentage, 0) <> 0;

-- Disable old discount-specific ads; keep featured, main, urgent and other ads unchanged.
UPDATE advertisements
SET ad_type = 'featured', status = 'rejected', updated_at = NOW()
WHERE ad_type = 'discount';

-- Prevent creating a new discount advertisement through the database.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advertisements_ad_type_check') THEN
    ALTER TABLE advertisements DROP CONSTRAINT advertisements_ad_type_check;
  END IF;
  ALTER TABLE advertisements
    ADD CONSTRAINT advertisements_ad_type_check
    CHECK (ad_type IN ('featured', 'main', 'urgent'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
