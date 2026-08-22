-- -- =====================================================
-- -- 🚗 Car Rental System - Migration 003
-- -- Add Discounts, Brand Logo, and Brand Description
-- -- =====================================================

-- -- 1. Add discount_percentage to cars
-- ALTER TABLE cars ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- -- 2. Add brand details to users
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS brand_logo VARCHAR(500);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS brand_description TEXT;
