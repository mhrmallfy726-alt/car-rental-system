BEGIN;

ALTER TABLE email_verifications
  ADD COLUMN IF NOT EXISTS user_data JSONB;

COMMIT;
