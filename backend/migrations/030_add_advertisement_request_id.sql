BEGIN;

ALTER TABLE advertisements
  ADD COLUMN IF NOT EXISTS request_id UUID
  REFERENCES advertisement_requests(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ads_request_id
  ON advertisements(request_id);

COMMIT;
