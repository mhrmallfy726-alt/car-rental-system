BEGIN;

ALTER TABLE handover_verifications
  ADD COLUMN IF NOT EXISTS supplier_decision VARCHAR(20),
  ADD COLUMN IF NOT EXISTS supplier_decision_notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS supplier_decided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supplier_decided_by UUID REFERENCES users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'handover_verifications_supplier_decision_check'
  ) THEN
    ALTER TABLE handover_verifications
      ADD CONSTRAINT handover_verifications_supplier_decision_check
      CHECK (supplier_decision IS NULL OR supplier_decision IN ('accepted', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_handover_verifications_decision
  ON handover_verifications(reservation_id, supplier_decision, supplier_decided_at DESC);

COMMIT;
