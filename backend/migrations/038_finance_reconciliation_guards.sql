BEGIN;

-- Keep the first successful payment for a reservation and mark later duplicates failed.
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY reservation_id ORDER BY created_at, id) AS row_number
  FROM payments
  WHERE reservation_id IS NOT NULL AND status = 'paid'
)
UPDATE payments p
   SET status = 'failed', updated_at = NOW(), metadata = p.metadata || '{"reconciled_duplicate": true}'::jsonb
 WHERE p.id IN (SELECT id FROM duplicates WHERE row_number > 1);

-- A payment must have one entry per accounting type; remove only exact duplicate rows.
DELETE FROM ledger_entries a
USING ledger_entries b
WHERE a.ctid > b.ctid
  AND a.payment_id IS NOT NULL
  AND a.payment_id = b.payment_id
  AND a.entry_type = b.entry_type;

CREATE UNIQUE INDEX IF NOT EXISTS ux_paid_reservation_payment
  ON payments (reservation_id)
  WHERE reservation_id IS NOT NULL AND status = 'paid';

CREATE UNIQUE INDEX IF NOT EXISTS ux_ledger_payment_entry_type
  ON ledger_entries (payment_id, entry_type)
  WHERE payment_id IS NOT NULL;

COMMIT;
