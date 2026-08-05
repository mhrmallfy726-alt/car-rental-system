ALTER TABLE handover_logs
ADD COLUMN customer_status VARCHAR(30) DEFAULT 'pending';

ALTER TABLE handover_logs
ADD COLUMN customer_notes TEXT;

ALTER TABLE handover_logs
ADD COLUMN customer_reviewed_at TIMESTAMP;