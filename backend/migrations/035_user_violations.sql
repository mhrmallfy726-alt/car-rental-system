BEGIN;

CREATE TABLE IF NOT EXISTS user_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason VARCHAR(200) NOT NULL,
  description TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'serious')),
  violation_number INTEGER NOT NULL CHECK (violation_number > 0),
  action_taken VARCHAR(30) NOT NULL CHECK (action_taken IN ('warning', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_violations_user_created
  ON user_violations(user_id, created_at DESC);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN ('reservation', 'payment', 'review', 'complaint', 'system', 'document', 'car', 'violation')
);

COMMIT;
