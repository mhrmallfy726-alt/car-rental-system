ALTER TABLE handover_logs
  ADD COLUMN IF NOT EXISTS customer_status VARCHAR(30) DEFAULT 'pending';

ALTER TABLE handover_logs
  ADD COLUMN IF NOT EXISTS customer_notes TEXT;

ALTER TABLE handover_logs
  ADD COLUMN IF NOT EXISTS customer_reviewed_at TIMESTAMP;
