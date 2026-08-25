BEGIN;

-- إزالة قيد الحالة القديم فقط، دون المساس بقيود handover أو قيود الأعمدة الأخرى.
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

-- تحويل الحالات القديمة إلى قيم معتمدة قبل إنشاء القيد الجديد.
UPDATE public.reservations
SET status = CASE LOWER(TRIM(COALESCE(status, 'pending')))
  WHEN 'confirmed' THEN 'approved'
  WHEN 'accepted' THEN 'approved'
  WHEN 'approved' THEN 'approved'
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
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN (
    'pending_payment',
    'pending',
    'approved',
    'awaiting_pickup',
    'active',
    'returned',
    'completed',
    'cancelled',
    'rejected',
    'disputed'
  ));

COMMIT;
