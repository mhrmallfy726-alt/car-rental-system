BEGIN;

CREATE OR REPLACE FUNCTION prevent_duplicate_account_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(LOWER(NEW.email), 0));
  END IF;

  IF TG_TABLE_NAME = 'users' THEN
    IF NEW.email IS NOT NULL AND EXISTS (
      SELECT 1
      FROM employees
      WHERE LOWER(email) = LOWER(NEW.email)
        AND id IS DISTINCT FROM NEW.id
    ) THEN
      RAISE EXCEPTION 'EMAIL_ALREADY_IN_USE_ACROSS_ACCOUNTS'
        USING ERRCODE = '23505';
    END IF;
  ELSE
    IF NEW.email IS NOT NULL AND EXISTS (
      SELECT 1
      FROM users
      WHERE LOWER(email) = LOWER(NEW.email)
        AND id IS DISTINCT FROM NEW.id
    ) THEN
      RAISE EXCEPTION 'EMAIL_ALREADY_IN_USE_ACROSS_ACCOUNTS'
        USING ERRCODE = '23505';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_email_from_users ON users;
CREATE TRIGGER prevent_duplicate_email_from_users
BEFORE INSERT OR UPDATE OF email ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_account_email();

DROP TRIGGER IF EXISTS prevent_duplicate_email_from_employees ON employees;
CREATE TRIGGER prevent_duplicate_email_from_employees
BEFORE INSERT OR UPDATE OF email ON employees
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_account_email();

COMMIT;
