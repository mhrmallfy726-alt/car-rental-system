-- Supplier branches/showrooms use the existing locations table.
-- No new showroom table is created.
-- Each location represents one showroom/branch and can be reused by the supplier's cars.

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS showroom_name VARCHAR(150);

-- A showroom name is unique across the platform when provided.
CREATE UNIQUE INDEX IF NOT EXISTS locations_showroom_name_unique_idx
  ON locations (LOWER(TRIM(showroom_name)))
  WHERE showroom_name IS NOT NULL AND TRIM(showroom_name) <> '';

-- Keep existing data valid: showroom_name is optional for legacy locations.
