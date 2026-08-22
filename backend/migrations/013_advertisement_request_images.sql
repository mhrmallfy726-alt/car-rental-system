-- Store the uploaded advertisement image path on the supplier request
ALTER TABLE advertisement_requests
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- advertisements.image_url already exists in 002_advertisements.sql.
-- This index is intentionally omitted because image URLs are not filtered.
