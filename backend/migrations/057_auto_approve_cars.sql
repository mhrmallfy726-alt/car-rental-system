-- اعتماد السيارات تلقائيًا عند الإضافة بدل انتظار موافقة الأدمن.
-- لا نغيّر السيارات المرفوضة سابقًا حتى تبقى أسباب الرفض والإجراء الرقابي محفوظة.
UPDATE cars
SET is_approved = TRUE,
    status = CASE WHEN status = 'inactive' THEN 'available' ELSE status END,
    approved_by = NULL,
    approved_at = COALESCE(approved_at, NOW())
WHERE is_approved = FALSE
  AND rejection_reason IS NULL;

ALTER TABLE cars
  ALTER COLUMN is_approved SET DEFAULT TRUE;
