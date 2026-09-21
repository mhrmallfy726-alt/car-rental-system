BEGIN;

-- Keep branch-manager emails unique across users, employees, and branch accounts.
-- TRIM is intentional: legacy employee records may contain surrounding spaces.
CREATE OR REPLACE FUNCTION prevent_duplicate_account_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_email TEXT;
BEGIN
  normalized_email := LOWER(TRIM(NEW.email));
  IF normalized_email IS NULL OR normalized_email = '' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(normalized_email, 0));

  IF TG_TABLE_NAME <> 'users' AND EXISTS (
    SELECT 1 FROM users
    WHERE LOWER(TRIM(email)) = normalized_email
      AND id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_IN_USE_ACROSS_ACCOUNTS' USING ERRCODE = '23505';
  END IF;

  IF TG_TABLE_NAME <> 'employees' AND EXISTS (
    SELECT 1 FROM employees
    WHERE LOWER(TRIM(email)) = normalized_email
      AND id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_IN_USE_ACROSS_ACCOUNTS' USING ERRCODE = '23505';
  END IF;

  IF TG_TABLE_NAME <> 'branch_accounts' AND EXISTS (
    SELECT 1 FROM branch_accounts
    WHERE LOWER(TRIM(email)) = normalized_email
      AND id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_IN_USE_ACROSS_ACCOUNTS' USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_email_from_users ON users;
CREATE TRIGGER prevent_duplicate_email_from_users
BEFORE INSERT OR UPDATE OF email ON users
FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_account_email();

DROP TRIGGER IF EXISTS prevent_duplicate_email_from_employees ON employees;
CREATE TRIGGER prevent_duplicate_email_from_employees
BEFORE INSERT OR UPDATE OF email ON employees
FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_account_email();

DROP TRIGGER IF EXISTS prevent_duplicate_email_from_branch_accounts ON branch_accounts;
CREATE TRIGGER prevent_duplicate_email_from_branch_accounts
BEFORE INSERT OR UPDATE OF email ON branch_accounts
FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_account_email();

COMMIT;
