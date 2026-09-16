BEGIN;

-- Supplier earnings are held after card capture and become payable only after
-- the before-handover report succeeds.
ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_entry_type_check;
ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_entry_type_check
  CHECK (entry_type IN ('charge', 'platform_revenue', 'platform_fee', 'supplier_pending', 'supplier_payable', 'refund', 'payout', 'adjustment'));

CREATE INDEX IF NOT EXISTS idx_ledger_reservation_type
  ON ledger_entries (reservation_id, entry_type, direction);

COMMIT;
