-- كل صلاحية manage_* تمثل إدارة القسم بالكامل.
UPDATE permissions SET description = 'إدارة الإعلانات بالكامل: إنشاء وتعديل واعتماد ورفض الطلبات' WHERE name = 'manage_advertisements';
UPDATE permissions SET description = 'إدارة الحجوزات بالكامل: تعديل وموافقة ورفض وإكمال الحجوزات' WHERE name = 'manage_reservations';
UPDATE permissions SET description = 'إدارة المالية بالكامل ضمن بيانات المورد وتقاريرها' WHERE name = 'manage_finance';
UPDATE permissions SET description = 'إدارة التسليم والاستلام بالكامل وإنشاء التقارير ورفع الصور' WHERE name = 'manage_handover';
UPDATE permissions SET description = 'إدارة السيارات بالكامل: إنشاء وتعديل وحذف السيارات' WHERE name = 'manage_cars';
