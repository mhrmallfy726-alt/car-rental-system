BEGIN;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS with_driver BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS driver_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE handover_logs
  ADD COLUMN IF NOT EXISTS recorded_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_job_role_check;
ALTER TABLE employees ADD CONSTRAINT employees_job_role_check
  CHECK (job_role IN ('team_manager','advertisements','reservations','finance','fleet','delivery'));

INSERT INTO permissions (name, description) VALUES
  ('view_handover', 'عرض تقارير تسليم واستلام السيارات'),
  ('manage_handover', 'رفع وتعديل تقارير تسليم واستلام السيارات والتواصل مع العميل')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO employees_permissions (employee_id, permission_id)
SELECT e.id, p.id
FROM employees e
CROSS JOIN permissions p
WHERE e.job_role = 'team_manager'
  AND p.name IN ('view_handover', 'manage_handover')
ON CONFLICT (employee_id, permission_id) DO NOTHING;

COMMIT;
