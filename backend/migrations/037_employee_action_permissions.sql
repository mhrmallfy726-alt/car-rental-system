-- صلاحيات العمليات التفصيلية للموظفين.
-- تبقى صلاحيات manage_* شاملة ومتوافقة مع الحسابات الحالية.
INSERT INTO permissions (name, description) VALUES
  ('create_cars', 'إنشاء وإضافة سيارات المورد'),
  ('edit_cars', 'تعديل بيانات سيارات المورد'),
  ('delete_cars', 'حذف سيارات المورد'),
  ('edit_reservations', 'تعديل بيانات الحجوزات'),
  ('approve_reservations', 'الموافقة على الحجوزات'),
  ('reject_reservations', 'رفض الحجوزات'),
  ('complete_reservations', 'إكمال الحجوزات'),
  ('approve_advertisements', 'الموافقة على طلبات الإعلانات'),
  ('reject_advertisements', 'رفض طلبات الإعلانات'),
  ('manage_handover', 'إنشاء وتحديث تقارير تسليم واستلام السيارات')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
