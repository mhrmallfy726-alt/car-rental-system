BEGIN;

-- Repair migration for databases where the finance migration stopped midway.
-- It is safe to run repeatedly and adapts to UUID or integer legacy identifiers.
DO $$
DECLARE
  ad_id_type TEXT;
  payment_id_type TEXT;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO ad_id_type
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = current_schema()
     AND c.relname = 'advertisements'
     AND a.attname = 'id'
     AND NOT a.attisdropped;

  SELECT format_type(a.atttypid, a.atttypmod)
    INTO payment_id_type
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = current_schema()
     AND c.relname = 'payments'
     AND a.attname = 'id'
     AND NOT a.attisdropped;

  IF ad_id_type IS NULL THEN
    RAISE EXCEPTION 'لم يتم العثور على advertisements.id';
  END IF;
  IF payment_id_type IS NULL THEN
    RAISE EXCEPTION 'لم يتم العثور على payments.id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'advertisement_id'
  ) THEN
    EXECUTE format('ALTER TABLE payments ADD COLUMN advertisement_id %s', ad_id_type);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'payer_id'
  ) THEN
    EXECUTE 'ALTER TABLE payments ADD COLUMN payer_id UUID';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'supplier_id'
  ) THEN
    EXECUTE 'ALTER TABLE payments ADD COLUMN supplier_id UUID';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'provider_reference'
  ) THEN
    EXECUTE 'ALTER TABLE payments ADD COLUMN provider_reference VARCHAR(200)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'metadata'
  ) THEN
    EXECUTE 'ALTER TABLE payments ADD COLUMN metadata JSONB NOT NULL DEFAULT ''{}''::jsonb';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'refund_amount'
  ) THEN
    EXECUTE 'ALTER TABLE payments ADD COLUMN refund_amount NUMERIC(14,2) DEFAULT 0';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'refund_reason'
  ) THEN
    EXECUTE 'ALTER TABLE payments ADD COLUMN refund_reason TEXT';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'payments' AND column_name = 'refunded_at'
  ) THEN
    EXECUTE 'ALTER TABLE payments ADD COLUMN refunded_at TIMESTAMPTZ';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_advertisement_id_fkey') THEN
    EXECUTE 'ALTER TABLE payments ADD CONSTRAINT payments_advertisement_id_fkey FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE RESTRICT';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_ad_provider_reference_unique') THEN
    EXECUTE 'ALTER TABLE payments ADD CONSTRAINT payments_ad_provider_reference_unique UNIQUE (provider_reference)';
  END IF;
END $$;

ALTER TABLE payments ALTER COLUMN reservation_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS price_per_day NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS total_price NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

DO $$
DECLARE payment_id_type TEXT;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO payment_id_type
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = current_schema() AND c.relname = 'payments'
     AND a.attname = 'id' AND NOT a.attisdropped;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'advertisements' AND column_name = 'payment_id'
  ) THEN
    EXECUTE format('ALTER TABLE advertisements ADD COLUMN payment_id %s', payment_id_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advertisements_payment_id_fkey') THEN
    EXECUTE 'ALTER TABLE advertisements ADD CONSTRAINT advertisements_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL';
  END IF;
END $$;

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
  payment_id UUID,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entry_type VARCHAR(40) NOT NULL CHECK (entry_type IN ('charge', 'platform_revenue', 'platform_fee', 'supplier_payable', 'refund', 'payout', 'adjustment')),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('credit', 'debit')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'YER',
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
DECLARE
  ad_id_type TEXT;
  payment_id_type TEXT;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod) INTO ad_id_type
    FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = current_schema() AND c.relname = 'advertisements' AND a.attname = 'id' AND NOT a.attisdropped;
  SELECT format_type(a.atttypid, a.atttypmod) INTO payment_id_type
    FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = current_schema() AND c.relname = 'payments' AND a.attname = 'id' AND NOT a.attisdropped;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'ledger_entries' AND column_name = 'advertisement_id') THEN
    EXECUTE format('ALTER TABLE ledger_entries ADD COLUMN advertisement_id %s', ad_id_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'ledger_entries' AND column_name = 'payment_id') THEN
    EXECUTE format('ALTER TABLE ledger_entries ADD COLUMN payment_id %s', payment_id_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_advertisement_id_fkey') THEN
    EXECUTE 'ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_advertisement_id_fkey FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE SET NULL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_payment_id_fkey') THEN
    EXECUTE 'ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL';
  END IF;
END $$;

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

COMMIT;
