BEGIN;

INSERT INTO locations
  (supplier_id, showroom_name, city, country, address, latitude, longitude, is_active, subscription_status)
SELECT
  u.id,
  LEFT(COALESCE(NULLIF(TRIM(u.company_name), ''), NULLIF(TRIM(u.name), ''), 'المورد') || ' - المركز الرئيسي - ' || LEFT(u.id::text, 8), 150),
  COALESCE(NULLIF(TRIM(u.city), ''), 'صنعاء'),
  'Yemen',
  u.address,
  NULL,
  NULL,
  TRUE,
  'active'
FROM users u
WHERE u.role = 'supplier'
  AND NOT EXISTS (
    SELECT 1 FROM locations l WHERE l.supplier_id = u.id
  )
ON CONFLICT DO NOTHING;

COMMIT;
