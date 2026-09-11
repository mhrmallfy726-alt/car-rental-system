BEGIN;

ALTER TABLE advertisement_requests
  ADD COLUMN IF NOT EXISTS reviewer_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ad_requests_reviewer_employee
  ON advertisement_requests(reviewer_employee_id);

INSERT INTO permissions (name, description) VALUES
  ('view_handover', 'عرض تقارير تسليم واستلام السيارات'),
  ('manage_handover', 'رفع وتعديل تقارير تسليم واستلام السيارات والتواصل مع العميل')
ON CONFLICT (name) DO NOTHING;

INSERT INTO employees_permissions (employee_id, permission_id)
SELECT e.id, p.id
FROM employees e
JOIN permissions p ON p.name = ANY(ARRAY['view_reservations', 'view_customers', 'view_handover', 'manage_handover']::text[])
WHERE e.job_role = 'delivery'
ON CONFLICT (employee_id, permission_id) DO NOTHING;

COMMIT;
