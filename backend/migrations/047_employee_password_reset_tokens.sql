BEGIN;

-- Allow a reset token to belong to either a user account or an employee account.
ALTER TABLE password_reset_tokens
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE password_reset_tokens
  ADD COLUMN IF NOT EXISTS employee_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'password_reset_tokens_employee_id_fkey'
      AND conrelid = 'password_reset_tokens'::regclass
  ) THEN
    ALTER TABLE password_reset_tokens
      ADD CONSTRAINT password_reset_tokens_employee_id_fkey
      FOREIGN KEY (employee_id)
      REFERENCES employees(id)
      ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE password_reset_tokens
  DROP CONSTRAINT IF EXISTS password_reset_tokens_one_owner_check;

ALTER TABLE password_reset_tokens
  ADD CONSTRAINT password_reset_tokens_one_owner_check
  CHECK (
    (user_id IS NOT NULL AND employee_id IS NULL)
    OR
    (user_id IS NULL AND employee_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_employee
  ON password_reset_tokens(employee_id, created_at DESC);

COMMIT;
