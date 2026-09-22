BEGIN;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON employees(branch_id);

-- Existing employees remain supplier-level unless explicitly assigned to a branch.
-- New branch-created employees are always stored with the authenticated branch_id.

COMMIT;
