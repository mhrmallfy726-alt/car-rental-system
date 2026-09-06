BEGIN;

-- Keep the technical account role stable for every employee.
UPDATE employees
SET role = 'employee'
WHERE role IS DISTINCT FROM 'employee';

-- Remove any previous version of the job-role constraint before normalization.
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_job_role_check;

-- Normalize all legacy and specialized values to the application's final values.
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

-- Reset permissions according to each employee's final business role.
DELETE FROM employees_permissions ep
USING employees e
WHERE e.id = ep.employee_id;

INSERT INTO employees_permissions (employee_id, permission_id)
SELECT e.id, p.id
FROM employees e
JOIN permissions p ON p.name = ANY(
  CASE e.job_role
    WHEN 'team_manager' THEN ARRAY[
      'view_cars','manage_cars','view_fleet_performance',
      'view_reservations','manage_reservations','view_customers',
      'view_advertisements','manage_advertisements','view_ad_performance',
      'view_finance','manage_finance','manage_team','view_team_performance'
    ]
    WHEN 'advertisements' THEN ARRAY[
      'view_advertisements','manage_advertisements','view_ad_performance'
    ]
    WHEN 'reservations' THEN ARRAY[
      'view_reservations','manage_reservations','view_customers'
    ]
    WHEN 'finance' THEN ARRAY[
      'view_finance','manage_finance'
    ]
    ELSE ARRAY[
      'view_cars','manage_cars','view_fleet_performance'
    ]
  END
)
ON CONFLICT DO NOTHING;

COMMIT;
