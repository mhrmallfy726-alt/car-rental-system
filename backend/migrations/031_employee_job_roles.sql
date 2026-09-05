BEGIN;

-- Business-facing job role. The technical account role remains employee/manager for backward compatibility.
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS job_role VARCHAR(40) NOT NULL DEFAULT 'fleet_employee';

-- Normalize the old records into the new business-role model.
UPDATE employees
SET job_role = CASE
  WHEN role = 'manager' THEN 'team_manager'
  WHEN job_role IS NULL OR job_role = '' THEN 'fleet'
  ELSE job_role
END;
UPDATE employees
SET job_role = 'fleet'
WHERE job_role = 'fleet_employee';
INSERT INTO permissions (name, description) VALUES
  ('view_advertisements', 'عرض الإعلانات وطلبات الإعلانات'),
  ('manage_advertisements', 'إدارة طلبات وحملات الإعلانات'),
  ('view_ad_performance', 'مراقبة أداء الإعلانات والإحصاءات'),
  ('view_reservations', 'عرض حجوزات المورد'),
  ('manage_reservations', 'إدارة حالات حجوزات المورد'),
  ('view_customers', 'عرض بيانات العملاء المرتبطين بالحجوزات'),
  ('view_finance', 'عرض التقارير المالية المسموح بها'),
  ('manage_finance', 'إدارة العمليات المالية المسموح بها'),
  ('view_cars', 'عرض أسطول سيارات المورد'),
  ('manage_cars', 'إضافة وتعديل وإدارة سيارات المورد'),
  ('view_fleet_performance', 'مراقبة أداء الأسطول والإحصاءات'),
  ('manage_team', 'إدارة فريق عمل المورد'),
  ('view_team_performance', 'مراقبة أداء فريق العمل')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Keep the legacy permissions available and make their descriptions consistent.
UPDATE permissions SET description = 'عرض أسطول سيارات المورد' WHERE name = 'view_cars';
UPDATE permissions SET description = 'إضافة وتعديل وإدارة سيارات المورد' WHERE name = 'manage_cars';
UPDATE permissions SET description = 'عرض حجوزات المورد' WHERE name = 'view_reservations';
UPDATE permissions SET description = 'إدارة حالات حجوزات المورد' WHERE name = 'manage_reservations';
UPDATE permissions SET description = 'عرض بيانات العملاء المرتبطين بالحجوزات' WHERE name = 'view_customers';
UPDATE permissions SET description = 'إدارة طلبات وحملات الإعلانات' WHERE name = 'manage_advertisements';
UPDATE permissions SET description = 'عرض التقارير المالية المسموح بها' WHERE name = 'view_finance';
UPDATE permissions SET description = 'إدارة فريق عمل المورد' WHERE name = 'manage_team';

COMMIT;
