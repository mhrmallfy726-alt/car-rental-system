BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- الحسابات القديمة تبقى فعالة، أما المورد الجديد فيُنشأ بحالة pending صراحةً من مسار OTP.
UPDATE users
SET verification_status = CASE
  WHEN role = 'supplier' AND COALESCE(verification_status, '') = '' THEN 'approved'
  WHEN COALESCE(verification_status, '') = '' THEN 'approved'
  ELSE verification_status
END
WHERE verification_status IS NULL OR verification_status = '';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_verification_status_check;
ALTER TABLE users ADD CONSTRAINT users_verification_status_check
  CHECK (verification_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN ('reservation', 'payment', 'review', 'complaint', 'system', 'document', 'car', 'violation')
);

CREATE INDEX IF NOT EXISTS idx_users_supplier_verification
  ON users (verification_status, created_at DESC)
  WHERE role = 'supplier';

COMMIT;
