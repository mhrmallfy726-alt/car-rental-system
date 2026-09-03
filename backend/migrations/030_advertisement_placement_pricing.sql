BEGIN;

-- أسعار الإعلان اليومية حسب مكان الظهور.
-- السعر الأساسي تضبطه الإدارة، والمكان يطبق معاملًا مختلفًا تلقائيًا.
ALTER TABLE finance_settings
  ADD COLUMN IF NOT EXISTS advertisement_price_home_per_day NUMERIC(14, 2) NOT NULL DEFAULT 2000 CHECK (advertisement_price_home_per_day > 0),
  ADD COLUMN IF NOT EXISTS advertisement_price_cars_per_day NUMERIC(14, 2) NOT NULL DEFAULT 1000 CHECK (advertisement_price_cars_per_day > 0),
  ADD COLUMN IF NOT EXISTS advertisement_price_car_detail_per_day NUMERIC(14, 2) NOT NULL DEFAULT 1500 CHECK (advertisement_price_car_detail_per_day > 0),
  ADD COLUMN IF NOT EXISTS advertisement_price_all_public_per_day NUMERIC(14, 2) NOT NULL DEFAULT 2500 CHECK (advertisement_price_all_public_per_day > 0);

UPDATE finance_settings
SET advertisement_price_home_per_day = advertisement_price_per_day * 2,
    advertisement_price_cars_per_day = advertisement_price_per_day,
    advertisement_price_car_detail_per_day = advertisement_price_per_day * 1.5,
    advertisement_price_all_public_per_day = advertisement_price_per_day * 2.5
WHERE id = 1;

-- السعر الفعلي يحسب في قاعدة البيانات حتى لا يستطيع العميل تغيير المبلغ المرسل من الواجهة.
CREATE OR REPLACE FUNCTION calculate_advertisement_placement_price()
RETURNS TRIGGER AS $$
DECLARE
  base_price NUMERIC(14,2);
BEGIN
  SELECT advertisement_price_per_day INTO base_price FROM finance_settings WHERE id = 1;

  IF NEW.placement IN ('home', 'homepage') THEN
    NEW.price_per_day := base_price * 2;
  ELSIF NEW.placement = 'cars' THEN
    NEW.price_per_day := base_price;
  ELSIF NEW.placement IN ('car_detail', 'car_details') THEN
    NEW.price_per_day := base_price * 1.5;
  ELSIF NEW.placement = 'all_public' THEN
    NEW.price_per_day := base_price * 2.5;
  ELSE
    NEW.price_per_day := base_price;
  END IF;

  NEW.total_price := COALESCE(NEW.price_per_day, base_price) * GREATEST(COALESCE(NEW.duration_days, 1), 1);
  NEW.requested_budget := NEW.total_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_advertisement_placement_price ON advertisement_requests;
CREATE TRIGGER trg_calculate_advertisement_placement_price
BEFORE INSERT OR UPDATE OF placement, duration_days ON advertisement_requests
FOR EACH ROW EXECUTE FUNCTION calculate_advertisement_placement_price();

-- إعادة حساب الطلبات القديمة وفق السعر الأساسي الحالي ومعامل مكان الظهور.
UPDATE advertisement_requests r
SET price_per_day = CASE
      WHEN r.placement IN ('home', 'homepage') THEN fs.advertisement_price_per_day * 2
      WHEN r.placement = 'cars' THEN fs.advertisement_price_per_day
      WHEN r.placement IN ('car_detail', 'car_details') THEN fs.advertisement_price_per_day * 1.5
      WHEN r.placement = 'all_public' THEN fs.advertisement_price_per_day * 2.5
      ELSE fs.advertisement_price_per_day
    END,
    total_price = CASE
      WHEN r.placement IN ('home', 'homepage') THEN fs.advertisement_price_per_day * 2
      WHEN r.placement = 'cars' THEN fs.advertisement_price_per_day
      WHEN r.placement IN ('car_detail', 'car_details') THEN fs.advertisement_price_per_day * 1.5
      WHEN r.placement = 'all_public' THEN fs.advertisement_price_per_day * 2.5
      ELSE fs.advertisement_price_per_day
    END * GREATEST(COALESCE(r.duration_days, 1), 1),
    requested_budget = CASE
      WHEN r.placement IN ('home', 'homepage') THEN fs.advertisement_price_per_day * 2
      WHEN r.placement = 'cars' THEN fs.advertisement_price_per_day
      WHEN r.placement IN ('car_detail', 'car_details') THEN fs.advertisement_price_per_day * 1.5
      WHEN r.placement = 'all_public' THEN fs.advertisement_price_per_day * 2.5
      ELSE fs.advertisement_price_per_day
    END * GREATEST(COALESCE(r.duration_days, 1), 1)
FROM finance_settings fs
WHERE fs.id = 1;

COMMIT;
