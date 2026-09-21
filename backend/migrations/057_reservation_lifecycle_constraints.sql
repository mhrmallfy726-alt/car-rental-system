BEGIN;

-- Remove both the original inline checks and the later lifecycle checks.
-- The initial schema created reservations_status_check implicitly, while
-- migration 012 created reservations_status_lifecycle_check explicitly.
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_lifecycle_check;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_handover_state_check;

-- pending_payment is the state before checkout; pending is the paid state
-- awaiting supplier review; disputed is also a valid handover outcome.
ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_lifecycle_check
  CHECK (status IN (
    'pending_payment', 'pending', 'approved', 'rejected', 'cancelled',
    'active', 'completed', 'disputed', 'awaiting_pickup', 'returned'
  ));

ALTER TABLE reservations
  ADD CONSTRAINT reservations_handover_state_check
  CHECK (handover_state IN (
    'pending_payment', 'not_started', 'awaiting_pickup', 'with_customer',
    'return_due', 'returned', 'disputed', 'closed'
  ));

COMMIT;
