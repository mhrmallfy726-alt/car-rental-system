BEGIN;

-- The application uses these stable business-facing values.
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_job_role_check;

UPDATE employees
SET job_role = CASE
  WHEN job_role IN ('team_manager', 'manager') THEN 'team_manager'
  WHEN job_role IN ('advertisements', 'advertising_employee') THEN 'advertisements'
  WHEN job_role IN ('reservations', 'reservations_employee') THEN 'reservations'
  WHEN job_role IN ('finance', 'finance_employee') THEN 'finance'
  WHEN job_role IN ('fleet', 'fleet_employee') THEN 'fleet'
  ELSE 'fleet'
END;

ALTER TABLE employees ADD CONSTRAINT employees_job_role_check
  CHECK (job_role IN ('team_manager','advertisements','reservations','finance','fleet'));

COMMIT;
