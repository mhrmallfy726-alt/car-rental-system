-- Supplier showroom subscriptions and canonical ownership on existing locations.
-- A supplier keeps one account/email and can own multiple locations/showrooms.

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('pending_payment','active','expired','suspended')),
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20)
    CHECK (subscription_plan IN ('monthly','annual')),
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

UPDATE locations l
SET supplier_id = x.supplier_id
FROM (
  SELECT location_id, MIN(supplier_id) AS supplier_id
  FROM cars
  WHERE location_id IS NOT NULL
  GROUP BY location_id
  HAVING COUNT(DISTINCT supplier_id) = 1
) x
WHERE l.id = x.location_id AND l.supplier_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_locations_supplier ON locations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_locations_subscription_status ON locations(subscription_status);

CREATE TABLE IF NOT EXISTS showroom_subscription_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  monthly_price NUMERIC(14,2) NOT NULL DEFAULT 10 CHECK (monthly_price >= 0),
  annual_price NUMERIC(14,2) NOT NULL DEFAULT 100 CHECK (annual_price >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'YER',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO showroom_subscription_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS showroom_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  showroom_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('monthly','annual')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'YER',
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','failed','refunded','cancelled')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  payment_id UUID,
  price_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_showroom_subscriptions_supplier ON showroom_subscriptions(supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_showroom_subscriptions_showroom ON showroom_subscriptions(showroom_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_showroom_subscriptions_status ON showroom_subscriptions(status);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS showroom_subscription_id UUID REFERENCES showroom_subscriptions(id) ON DELETE SET NULL;

ALTER TABLE showroom_subscriptions
  DROP CONSTRAINT IF EXISTS showroom_subscriptions_payment_id_fkey;
ALTER TABLE showroom_subscriptions
  ADD CONSTRAINT showroom_subscriptions_payment_id_fkey
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_single_subject;
ALTER TABLE payments
  ADD CONSTRAINT payments_single_subject CHECK (
    reservation_id IS NOT NULL OR advertisement_id IS NOT NULL OR showroom_subscription_id IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_payments_showroom_subscription ON payments(showroom_subscription_id);

CREATE OR REPLACE FUNCTION showroom_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS showroom_subscription_updated_at_trigger ON showroom_subscriptions;
CREATE TRIGGER showroom_subscription_updated_at_trigger
BEFORE UPDATE ON showroom_subscriptions
FOR EACH ROW EXECUTE FUNCTION showroom_subscription_updated_at();

UPDATE locations l
SET supplier_id = s.supplier_id,
    showroom_name = COALESCE(l.showroom_name, s.name),
    address = COALESCE(l.address, s.address),
    latitude = COALESCE(l.latitude, s.latitude),
    longitude = COALESCE(l.longitude, s.longitude)
FROM supplier_showrooms s
WHERE s.location_id = l.id AND l.supplier_id IS NULL;
