ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS is_chat BOOLEAN DEFAULT FALSE;

UPDATE complaints
SET is_chat = FALSE
WHERE is_chat IS NULL;

CREATE INDEX IF NOT EXISTS idx_complaints_is_chat
  ON complaints(is_chat);
