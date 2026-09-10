ALTER TABLE email_verifications
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP;
