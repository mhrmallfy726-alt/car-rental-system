-- Add automatic update timestamp support for supplier showroom branches.
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill existing locations created before updated_at was introduced.
UPDATE locations
SET updated_at = COALESCE(created_at, NOW())
WHERE updated_at IS NULL;

CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS locations_updated_at_trigger ON locations;

CREATE TRIGGER locations_updated_at_trigger
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_locations_updated_at();
