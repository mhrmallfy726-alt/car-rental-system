BEGIN;

ALTER TABLE finance_settings
  ADD COLUMN IF NOT EXISTS advertisement_price_per_day NUMERIC(14, 2) NOT NULL DEFAULT 1000 CHECK (advertisement_price_per_day > 0),
  ADD COLUMN IF NOT EXISTS advertisement_start_time TIME NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS advertisement_end_time TIME NOT NULL DEFAULT '22:00';

ALTER TABLE advertisement_requests
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

ALTER TABLE advertisements
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advertisements_placement_check') THEN
    ALTER TABLE advertisements DROP CONSTRAINT advertisements_placement_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advertisement_requests_placement_check') THEN
    ALTER TABLE advertisement_requests DROP CONSTRAINT advertisement_requests_placement_check;
  END IF;
END $$;

ALTER TABLE advertisements
  ADD CONSTRAINT advertisements_placement_check
  CHECK (placement IN ('all_public', 'home', 'homepage', 'cars', 'search_results', 'car_detail', 'car_details'));
ALTER TABLE advertisement_requests
  ADD CONSTRAINT advertisement_requests_placement_check
  CHECK (placement IN ('all_public', 'home', 'homepage', 'cars', 'search_results', 'car_detail', 'car_details'));

ALTER TABLE advertisement_requests
  ADD CONSTRAINT advertisement_request_time_check
  CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time);
ALTER TABLE advertisements
  ADD CONSTRAINT advertisement_time_check
  CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time);

UPDATE finance_settings
SET advertisement_start_time = COALESCE(advertisement_start_time, '08:00'),
    advertisement_end_time = COALESCE(advertisement_end_time, '22:00')
WHERE id = 1;

COMMIT;
