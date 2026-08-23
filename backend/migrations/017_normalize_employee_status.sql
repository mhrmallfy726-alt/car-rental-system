BEGIN;

-- Normalize legacy values such as Active, ACTIVE, and Inactive.
UPDATE employees
SET status = LOWER(TRIM(status))
WHERE status IS NOT NULL;

UPDATE employees
SET status = 'active'
WHERE status IS NULL OR status IN ('enabled', 'enable', 'on');

UPDATE employees
SET status = 'inactive'
WHERE status IN ('disabled', 'disable', 'off', 'suspended', 'blocked');

ALTER TABLE employees
  ALTER COLUMN status SET DEFAULT 'active';

COMMIT;
