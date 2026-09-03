BEGIN;

-- أسعار الإعلان اليومية حسب مكان الظهور.
-- القيم الافتراضية تجعل الصفحة الرئيسية أغلى، ثم كل الصفحات العامة، ثم تفاصيل السيارة، ثم قائمة السيارات.
ALTER TABLE finance_settings
  ADD COLUMN IF NOT EXISTS advertisement_price_home_per_day NUMERIC(14, 2) NOT NULL DEFAULT 2000 CHECK (advertisement_price_home_per_day > 0),
  ADD COLUMN IF NOT EXISTS advertisement_price_cars_per_day NUMERIC(14, 2) NOT NULL DEFAULT 1000 CHECK (advertisement_price_cars_per_day > 0),
  ADD COLUMN IF NOT EXISTS advertisement_price_car_detail_per_day NUMERIC(14, 2) NOT NULL DEFAULT 1500 CHECK (advertisement_price_car_detail_per_day > 0),
  ADD COLUMN IF NOT EXISTS advertisement_price_all_public_per_day NUMERIC(14, 2) NOT NULL DEFAULT 2500 CHECK (advertisement_price_all_public_per_day > 0);

-- ضمان أن بيانات الإعدادات القديمة تحصل على قيم صالحة عند تطبيق الهجرة.
UPDATE finance_settings
SET advertisement_price_home_per_day = COALESCE(advertisement_price_home_per_day, advertisement_price_per_day * 2),
    advertisement_price_cars_per_day = COALESCE(advertisement_price_cars_per_day, advertisement_price_per_day),
    advertisement_price_car_detail_per_day = COALESCE(advertisement_price_car_detail_per_day, advertisement_price_per_day * 1.5),
    advertisement_price_all_public_per_day = COALESCE(advertisement_price_all_public_per_day, advertisement_price_per_day * 2.5)
WHERE id = 1;

COMMIT;
