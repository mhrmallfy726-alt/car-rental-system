-- Store the admin decision when a submitted car is rejected.
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_cars_rejection_status
  ON cars (is_approved, rejected_at DESC);
