ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS commercial_register VARCHAR(500),
  ADD COLUMN IF NOT EXISTS owner_id VARCHAR(500),
  ADD COLUMN IF NOT EXISTS late_fee_price_per_hour DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grace_period_hours DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS brand_logo VARCHAR(500),
  ADD COLUMN IF NOT EXISTS brand_description TEXT,
  ADD COLUMN IF NOT EXISTS iban VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS auto_accept_bookings BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_normalized VARCHAR(30);

UPDATE users
SET verification_status = COALESCE(NULLIF(verification_status, ''), 'approved')
WHERE verification_status IS NULL OR verification_status = '';

UPDATE users
SET phone_normalized = phone
WHERE phone_normalized IS NULL AND phone IS NOT NULL;
