-- Branch approval workflow: a branch remains unavailable until an admin reviews it.
ALTER TABLE locations
  DROP CONSTRAINT IF EXISTS locations_subscription_status_check;

ALTER TABLE locations
  ADD CONSTRAINT locations_subscription_status_check
  CHECK (subscription_status IN ('pending_payment','pending_approval','active','expired','suspended'));

ALTER TABLE showroom_subscriptions
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

UPDATE showroom_subscriptions ss
SET approval_status = CASE
  WHEN ss.status = 'paid' AND l.is_active = TRUE THEN 'approved'
  ELSE 'pending'
END
FROM locations l
WHERE l.id = ss.showroom_id
  AND ss.approval_status IS NULL;

UPDATE showroom_subscriptions
SET approval_status = 'pending'
WHERE approval_status IS NULL;

ALTER TABLE showroom_subscriptions
  ALTER COLUMN approval_status SET DEFAULT 'pending',
  ALTER COLUMN approval_status SET NOT NULL;

ALTER TABLE showroom_subscriptions
  DROP CONSTRAINT IF EXISTS showroom_subscriptions_approval_status_check;

ALTER TABLE showroom_subscriptions
  ADD CONSTRAINT showroom_subscriptions_approval_status_check
  CHECK (approval_status IN ('pending','approved','rejected'));

CREATE INDEX IF NOT EXISTS idx_showroom_subscriptions_approval
  ON showroom_subscriptions(approval_status, created_at DESC);
