BEGIN;

-- Repair migration for databases where 014_finance_simulation.sql stopped midway.
-- All statements are idempotent and safe to run more than once.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS advertisement_id UUID REFERENCES advertisements(id) ON DELETE RESTRICT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer_id UUID REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_reference VARCHAR(200);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(14, 2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE payments ALTER COLUMN reservation_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS price_per_day NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS total_price NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS finance_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  currency VARCHAR(10) NOT NULL DEFAULT 'YER',
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  settlement_mode VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (settlement_mode IN ('manual', 'automatic')),
  ad_charge_policy VARCHAR(30) NOT NULL DEFAULT 'after_approval' CHECK (ad_charge_policy IN ('after_approval')),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO finance_settings (id, currency, commission_rate, settlement_mode, ad_charge_policy)
VALUES (1, 'YER', 10, 'manual', 'after_approval')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  advertisement_id UUID REFERENCES advertisements(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entry_type VARCHAR(40) NOT NULL CHECK (entry_type IN ('charge', 'platform_revenue', 'platform_fee', 'supplier_payable', 'refund', 'payout', 'adjustment')),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('credit', 'debit')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'YER',
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'YER',
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('manual', 'automatic')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  notes TEXT,
  external_reference VARCHAR(200),
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_advertisement_payment
  ON payments(advertisement_id)
  WHERE advertisement_id IS NOT NULL AND status IN ('pending', 'paid');
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_advertisement ON payments(advertisement_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON ledger_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON supplier_payouts(status, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_ad_provider_reference_unique'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_ad_provider_reference_unique UNIQUE (provider_reference);
  END IF;
END $$;

COMMIT;
