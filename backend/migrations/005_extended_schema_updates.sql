-- -- Add image_url to categories
-- ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- -- Update users table for better profile support (if missing)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS brand_logo VARCHAR(500);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS brand_description TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS iban VARCHAR(50);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_accept_bookings BOOLEAN DEFAULT FALSE;
