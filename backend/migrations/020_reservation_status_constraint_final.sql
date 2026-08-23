BEGIN;

-- توحيد القيم الحالية قبل إعادة إنشاء القيد.
UPDATE public.reservations
SET status = LOWER(TRIM(status))
WHERE status IS NOT NULL;

-- إزالة أي قيد قديم على عمود reservations.status مهما كان اسمه.
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
