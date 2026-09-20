-- Branch-scoped login accounts.
-- A branch account belongs to exactly one supplier and one canonical locations row.
CREATE TABLE IF NOT EXISTS branch_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT branch_accounts_branch_unique UNIQUE (branch_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS branch_accounts_email_unique_idx
  ON branch_accounts (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_branch_accounts_supplier ON branch_accounts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_branch_accounts_branch ON branch_accounts(branch_id);
CREATE OR REPLACE TRIGGER update_branch_accounts_updated_at
  BEFORE UPDATE ON branch_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enforce that a branch account can only be created for its owning supplier.
CREATE OR REPLACE FUNCTION validate_branch_account_supplier()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM locations WHERE id = NEW.branch_id AND supplier_id = NEW.supplier_id) THEN
    RAISE EXCEPTION 'branch_id does not belong to supplier_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_branch_account_supplier_trigger ON branch_accounts;
CREATE TRIGGER validate_branch_account_supplier_trigger
  BEFORE INSERT OR UPDATE ON branch_accounts
  FOR EACH ROW EXECUTE FUNCTION validate_branch_account_supplier();
