BEGIN;

CREATE TABLE IF NOT EXISTS exchange_rates (
  currency VARCHAR(10) PRIMARY KEY,
  rate_to_yer NUMERIC(18, 6) NOT NULL CHECK (rate_to_yer > 0),
  source VARCHAR(80) NOT NULL DEFAULT 'admin',
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO exchange_rates (currency, rate_to_yer, source)
VALUES ('YER', 1, 'system'), ('USD', 535, 'initial'), ('SAR', 142, 'initial')
ON CONFLICT (currency) DO NOTHING;

ALTER TABLE cars ADD COLUMN IF NOT EXISTS price_currency VARCHAR(10) NOT NULL DEFAULT 'YER';
ALTER TABLE cars ADD COLUMN IF NOT EXISTS price_per_day_yer NUMERIC(14, 2);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS original_price NUMERIC(14, 2);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS original_currency VARCHAR(10);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC(18, 6);

-- Existing values were historically treated as YER. Preserve their numeric meaning.
UPDATE cars
SET price_per_day_yer = COALESCE(price_per_day_yer, price_per_day),
    original_price = COALESCE(original_price, price_per_day),
    original_currency = COALESCE(original_currency, 'YER'),
    exchange_rate_used = COALESCE(exchange_rate_used, 1),
    price_currency = 'YER'
WHERE price_per_day_yer IS NULL;

ALTER TABLE cars ALTER COLUMN price_per_day_yer SET DEFAULT 0;
ALTER TABLE cars ALTER COLUMN price_per_day_yer SET NOT NULL;

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS price_per_day_yer NUMERIC(14, 2);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS total_price_yer NUMERIC(14, 2);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC(18, 6);
UPDATE reservations
SET price_per_day_yer = COALESCE(price_per_day_yer, price_per_day),
    total_price_yer = COALESCE(total_price_yer, total_price),
    exchange_rate_used = COALESCE(exchange_rate_used, 1)
WHERE price_per_day_yer IS NULL OR total_price_yer IS NULL;

ALTER TABLE reservations ALTER COLUMN price_per_day_yer SET DEFAULT 0;
ALTER TABLE reservations ALTER COLUMN total_price_yer SET DEFAULT 0;
ALTER TABLE reservations ALTER COLUMN price_per_day_yer SET NOT NULL;
ALTER TABLE reservations ALTER COLUMN total_price_yer SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cars_price_yer ON cars(price_per_day_yer);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_updated ON exchange_rates(updated_at DESC);
COMMIT;
