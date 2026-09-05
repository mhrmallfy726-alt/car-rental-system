BEGIN;

ALTER TABLE saved_cards
  ADD COLUMN IF NOT EXISTS simulated_balance_yer NUMERIC(14,2) NOT NULL DEFAULT 1000000 CHECK (simulated_balance_yer >= 0),
  ADD COLUMN IF NOT EXISTS gateway_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (gateway_status IN ('active','blocked','expired')),
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_saved_cards_gateway_user ON saved_cards(user_id, gateway_status);

CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  saved_card_id UUID NOT NULL REFERENCES saved_cards(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  provider_reference VARCHAR(200) NOT NULL UNIQUE,
  amount_yer NUMERIC(14,2) NOT NULL CHECK (amount_yer > 0),
  balance_before_yer NUMERIC(14,2) NOT NULL CHECK (balance_before_yer >= 0),
  balance_after_yer NUMERIC(14,2) NOT NULL CHECK (balance_after_yer >= 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('captured','declined','refunded')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gateway_transactions_user ON payment_gateway_transactions(user_id, created_at DESC);

COMMIT;
