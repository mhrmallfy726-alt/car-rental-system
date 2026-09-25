BEGIN;

-- توحيد نموذج الإعلان:
-- price = السعر الأساسي اليومي من إعدادات الإدارة.
-- price_per_day = السعر الفعلي لليوم حسب مكان الظهور.
-- total_price = السعر الإجمالي للمدة كاملة.
-- duration_days = مدة الإعلان.
ALTER TABLE advertisements
  ADD COLUMN IF NOT EXISTS duration_days INTEGER;

UPDATE advertisements a
SET duration_days = COALESCE(
  NULLIF(r.duration_days, 0),
  CASE
    WHEN a.start_date IS NOT NULL AND a.end_date IS NOT NULL
      THEN GREATEST((a.end_date - a.start_date) + 1, 1)
    ELSE 1
  END
)
FROM advertisement_requests r
WHERE a.request_id = r.id
  AND (a.duration_days IS NULL OR a.duration_days <= 0);

UPDATE advertisements
SET duration_days = CASE
  WHEN start_date IS NOT NULL AND end_date IS NOT NULL
    THEN GREATEST((end_date - start_date) + 1, 1)
  ELSE 1
END
WHERE duration_days IS NULL OR duration_days <= 0;

ALTER TABLE advertisements
  ALTER COLUMN duration_days SET DEFAULT 1,
  ALTER COLUMN duration_days SET NOT NULL;

-- الميزانية لم تعد جزءًا من نموذج الإعلان.
ALTER TABLE advertisements DROP COLUMN IF EXISTS budget;

-- طلب الإعلان يعتمد على السعر اليومي والإجمالي فقط.
ALTER TABLE advertisement_requests DROP COLUMN IF EXISTS requested_budget;

-- لا نحتفظ بأي منطق قديم يعيد كتابة الميزانية.
CREATE OR REPLACE FUNCTION calculate_advertisement_placement_price()
RETURNS TRIGGER AS $$
DECLARE
  base_price NUMERIC(14,2);
BEGIN
  SELECT advertisement_price_per_day
  INTO base_price
  FROM finance_settings
  WHERE id = 1;

  IF NEW.placement IN ('home', 'homepage') THEN
    NEW.price_per_day := COALESCE((SELECT advertisement_price_home_per_day FROM finance_settings WHERE id=1), base_price * 2);
  ELSIF NEW.placement = 'cars' THEN
    NEW.price_per_day := COALESCE((SELECT advertisement_price_cars_per_day FROM finance_settings WHERE id=1), base_price);
  ELSIF NEW.placement IN ('car_detail', 'car_details') THEN
    NEW.price_per_day := COALESCE((SELECT advertisement_price_car_detail_per_day FROM finance_settings WHERE id=1), base_price * 1.5);
  ELSIF NEW.placement = 'all_public' THEN
    NEW.price_per_day := COALESCE((SELECT advertisement_price_all_public_per_day FROM finance_settings WHERE id=1), base_price * 2.5);
  ELSE
    NEW.price_per_day := base_price;
  END IF;

  NEW.total_price := COALESCE(NEW.price_per_day, base_price) * GREATEST(COALESCE(NEW.duration_days, 1), 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
