BEGIN;

-- إزالة القيود القديمة قبل تطبيع الحالات.
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_status_lifecycle_check;

-- تحويل الحالات القديمة إلى الحالات القياسية قبل إنشاء القيد.
UPDATE public.reservations
SET status = CASE LOWER(TRIM(COALESCE(status, 'pending')))
  WHEN 'confirmed' THEN 'approved'
  WHEN 'accepted' THEN 'approved'
  WHEN 'requested' THEN 'pending'
  WHEN 'new' THEN 'pending'
  WHEN 'waiting' THEN 'pending'
  WHEN 'waiting_pickup' THEN 'awaiting_pickup'
  WHEN 'picked_up' THEN 'active'
  WHEN 'in_progress' THEN 'active'
  WHEN 'finished' THEN 'completed'
  WHEN 'done' THEN 'completed'
  WHEN 'declined' THEN 'rejected'
  WHEN 'denied' THEN 'rejected'
  WHEN 'cancel' THEN 'cancelled'
  WHEN 'canceled' THEN 'cancelled'
  WHEN 'pending_payment' THEN 'pending_payment'
  WHEN 'pending' THEN 'pending'
  WHEN 'approved' THEN 'approved'
  WHEN 'active' THEN 'active'
  WHEN 'awaiting_pickup' THEN 'awaiting_pickup'
  WHEN 'returned' THEN 'returned'
  WHEN 'completed' THEN 'completed'
  WHEN 'cancelled' THEN 'cancelled'
  WHEN 'rejected' THEN 'rejected'
  WHEN 'disputed' THEN 'disputed'
  ELSE 'pending'
END;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN (
    'pending_payment',
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

ALTER TABLE public.reservations
  ALTER COLUMN status SET DEFAULT 'pending';

COMMIT;
