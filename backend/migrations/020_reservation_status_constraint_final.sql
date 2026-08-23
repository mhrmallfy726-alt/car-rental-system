BEGIN;

-- إزالة القيد القديم أولاً حتى يمكن تنظيف السجلات المخالفة.
DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.reservations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS %I',
      constraint_row.conname
    );
  END LOOP;
END $$;

-- توحيد الحالات القديمة إلى حالات دورة الحجز المعتمدة.
UPDATE public.reservations
SET status = CASE LOWER(TRIM(COALESCE(status, 'pending')))
  WHEN 'confirmed' THEN 'approved'
  WHEN 'accepted' THEN 'approved'
  WHEN 'approved' THEN 'approved'
  WHEN 'requested' THEN 'pending'
  WHEN 'pending_payment' THEN 'pending'
  WHEN 'new' THEN 'pending'
  WHEN 'waiting' THEN 'pending'
  WHEN 'waiting_pickup' THEN 'awaiting_pickup'
  WHEN 'awaiting_pickup' THEN 'awaiting_pickup'
  WHEN 'picked_up' THEN 'active'
  WHEN 'in_progress' THEN 'active'
  WHEN 'active' THEN 'active'
  WHEN 'finished' THEN 'completed'
  WHEN 'done' THEN 'completed'
  WHEN 'completed' THEN 'completed'
  WHEN 'returned' THEN 'returned'
  WHEN 'declined' THEN 'rejected'
  WHEN 'denied' THEN 'rejected'
  WHEN 'rejected' THEN 'rejected'
  WHEN 'cancel' THEN 'cancelled'
  WHEN 'canceled' THEN 'cancelled'
  WHEN 'cancelled' THEN 'cancelled'
  WHEN 'disputed' THEN 'disputed'
  ELSE 'pending'
END;

ALTER TABLE public.reservations
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
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

COMMIT;
