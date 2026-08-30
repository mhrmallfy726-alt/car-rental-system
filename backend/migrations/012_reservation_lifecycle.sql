-- Reservation lifecycle: time-aware pickup/return, handover state, reminders
ALTER TABLE reservations
  add COLUMN IF NOT EXISTS pickup_time TIME,
  add COLUMN IF NOT EXISTS return_time TIME,
  add COLUMN IF NOT EXISTS pickup_at TIMESTAMPTZ,
  add COLUMN IF NOT EXISTS return_at TIMESTAMPTZ,
  add COLUMN IF NOT EXISTS handover_state VARCHAR(30) NOT NULL DEFAULT 'not_started',
  add COLUMN IF NOT EXISTS before_handover_at TIMESTAMPTZ,
  add COLUMN IF NOT EXISTS vehicle_delivered_at TIMESTAMPTZ,
  add COLUMN IF NOT EXISTS after_handover_at TIMESTAMPTZ,
  add COLUMN IF NOT EXISTS vehicle_returned_at TIMESTAMPTZ,
  add COLUMN IF NOT EXISTS pickup_reminder_sent_at TIMESTAMPTZ,
  add COLUMN IF NOT EXISTS return_reminder_sent_at TIMESTAMPTZ;

UPDATE reservations
SET pickup_time = COALESCE(pickup_time, TIME '09:00'),
    return_time = COALESCE(return_time, TIME '18:00'),
    pickup_at = COALESCE(pickup_at, start_date::timestamp + COALESCE(pickup_time, TIME '09:00')) AT TIME ZONE 'Asia/Aden',
    return_at = COALESCE(return_at, end_date::timestamp + COALESCE(return_time, TIME '18:00')) AT TIME ZONE 'Asia/Aden'
WHERE pickup_time IS NULL OR return_time IS NULL OR pickup_at IS NULL OR return_at IS NULL;

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_handover_state_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_handover_state_check
  CHECK (handover_state IN ('pending_payment','not_started', 'awaiting_pickup', 'with_customer', 'return_due', 'returned', 'closed'));

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_lifecycle_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_status_lifecycle_check
  CHECK (status IN ('pending_payment','pending', 'approved', 'rejected', 'cancelled', 'active', 'completed', 'disputed', 'awaiting_pickup', 'returned'));

CREATE INDEX IF NOT EXISTS idx_reservations_pickup_at ON reservations(pickup_at);
CREATE INDEX IF NOT EXISTS idx_reservations_return_at ON reservations(return_at);
CREATE INDEX IF NOT EXISTS idx_reservations_handover_state ON reservations(handover_state);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservation_pickup_reminder_once
  ON reservations(id, pickup_reminder_sent_at);

CREATE TABLE IF NOT EXISTS reservation_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  kind VARCHAR(40) NOT NULL CHECK (kind IN ('pickup_24h', 'return_24h', 'pickup_today', 'return_today', 'return_overdue')),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('in_app', 'whatsapp')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_message_id VARCHAR(200),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reservation_id, kind, channel)
);
CREATE INDEX IF NOT EXISTS idx_reservation_reminders_status ON reservation_reminders(status, kind);
