-- Global email registry. Enforces uniqueness across users, employees and branch_accounts.
CREATE TABLE IF NOT EXISTS account_emails (
  email TEXT PRIMARY KEY,
  account_type TEXT NOT NULL CHECK (account_type IN ('user', 'employee', 'branch_account')),
  account_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed existing records without changing existing application data.
INSERT INTO account_emails (email, account_type, account_id)
SELECT LOWER(TRIM(email)), 'user', id::TEXT FROM users
WHERE email IS NOT NULL AND TRIM(email) <> ''
ON CONFLICT (email) DO NOTHING;

INSERT INTO account_emails (email, account_type, account_id)
SELECT LOWER(TRIM(email)), 'employee', id::TEXT FROM employees
WHERE email IS NOT NULL AND TRIM(email) <> ''
ON CONFLICT (email) DO NOTHING;

INSERT INTO account_emails (email, account_type, account_id)
SELECT LOWER(TRIM(email)), 'branch_account', id::TEXT FROM branch_accounts
WHERE email IS NOT NULL AND TRIM(email) <> ''
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION sync_account_email_registry()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE normalized_email TEXT; resolved_type TEXT; resolved_id TEXT;
BEGIN
  resolved_type := CASE TG_TABLE_NAME WHEN 'users' THEN 'user' WHEN 'employees' THEN 'employee' WHEN 'branch_accounts' THEN 'branch_account' END;
  IF TG_OP = 'DELETE' THEN
    DELETE FROM account_emails WHERE account_type = resolved_type AND account_id = OLD.id::TEXT;
    RETURN OLD;
  END IF;
  normalized_email := LOWER(TRIM(NEW.email));
  IF normalized_email IS NULL OR normalized_email = '' THEN RETURN NEW; END IF;
  resolved_id := NEW.id::TEXT;
  IF EXISTS (SELECT 1 FROM account_emails WHERE email = normalized_email AND NOT (account_type = resolved_type AND account_id = resolved_id)) THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_EXISTS: %', normalized_email USING ERRCODE = '23505';
  END IF;
  DELETE FROM account_emails WHERE account_type = resolved_type AND account_id = resolved_id AND email <> normalized_email;
  INSERT INTO account_emails (email, account_type, account_id) VALUES (normalized_email, resolved_type, resolved_id)
  ON CONFLICT (email) DO UPDATE SET account_type = EXCLUDED.account_type, account_id = EXCLUDED.account_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_account_email_registry ON users;
CREATE TRIGGER trg_users_account_email_registry AFTER INSERT OR UPDATE OF email OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION sync_account_email_registry();
DROP TRIGGER IF EXISTS trg_employees_account_email_registry ON employees;
CREATE TRIGGER trg_employees_account_email_registry AFTER INSERT OR UPDATE OF email OR DELETE ON employees FOR EACH ROW EXECUTE FUNCTION sync_account_email_registry();
DROP TRIGGER IF EXISTS trg_branch_accounts_account_email_registry ON branch_accounts;
CREATE TRIGGER trg_branch_accounts_account_email_registry AFTER INSERT OR UPDATE OF email OR DELETE ON branch_accounts FOR EACH ROW EXECUTE FUNCTION sync_account_email_registry();

-- Audit existing duplicates before applying this migration:
-- SELECT LOWER(TRIM(email)) AS email, COUNT(*) FROM (SELECT email FROM users UNION ALL SELECT email FROM employees UNION ALL SELECT email FROM branch_accounts) x WHERE email IS NOT NULL AND TRIM(email) <> '' GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1;
