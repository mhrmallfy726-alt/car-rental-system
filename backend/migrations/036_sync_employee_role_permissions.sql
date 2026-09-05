BEGIN;

-- Keep every existing employee aligned with the permissions of their selected business role.
DELETE FROM employees_permissions;

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
    WHEN 'advertisements' THEN ARRAY['view_advertisements','manage_advertisements','view_ad_performance']
    WHEN 'reservations' THEN ARRAY['view_reservations','manage_reservations','view_customers']
    WHEN 'finance' THEN ARRAY['view_finance','manage_finance']
    WHEN 'fleet' THEN ARRAY['view_cars','manage_cars','view_fleet_performance']
    ELSE ARRAY[]::text[]
  END
)
ON CONFLICT (employee_id, permission_id) DO NOTHING;

COMMIT;
