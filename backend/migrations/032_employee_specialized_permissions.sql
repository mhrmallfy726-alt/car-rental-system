BEGIN;

-- Business job roles: technical role stays employee for all staff accounts.
UPDATE employees
SET role = 'employee'
WHERE role IS DISTINCT FROM 'employee';

-- Normalize known legacy values.
UPDATE employees
SET job_role = CASE
  WHEN job_role = 'team_manager' THEN 'team_manager'
  WHEN job_role = 'advertising_employee' THEN 'advertising_employee'
  WHEN job_role = 'reservations_employee' THEN 'reservations_employee'
  WHEN job_role = 'finance_employee' THEN 'finance_employee'
  WHEN job_role = 'fleet_employee' THEN 'fleet_employee'
  ELSE 'fleet_employee'
END;

-- Make the specialization explicit and safe.
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_job_role_check;
ALTER TABLE employees ADD CONSTRAINT employees_job_role_check
  CHECK (job_role IN ('team_manager','advertising_employee','reservations_employee','finance_employee','fleet_employee'));

-- Reset default access for specialized staff according to their business role.
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
    WHEN 'advertising_employee' THEN ARRAY[
      'view_advertisements','manage_advertisements','view_ad_performance'
    ]
    WHEN 'reservations_employee' THEN ARRAY[
      'view_reservations','manage_reservations','view_customers'
    ]
    WHEN 'finance_employee' THEN ARRAY[
      'view_finance','manage_finance'
    ]
    ELSE ARRAY[
      'view_cars','manage_cars','view_fleet_performance'
    ]
  END
)
ON CONFLICT DO NOTHING;

COMMIT;
