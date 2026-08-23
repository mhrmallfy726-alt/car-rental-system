BEGIN;

-- Normalize legacy reservation status constraints for the payment-first lifecycle.
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_lifecycle_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check
  CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'cancelled',
    'active',
    'completed',
    'disputed',
    'awaiting_pickup',
    'returned'
  ));

ALTER TABLE reservations
  ALTER COLUMN status SET DEFAULT 'pending';

COMMIT;
