BEGIN;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS is_main BOOLEAN NOT NULL DEFAULT FALSE;

WITH ranked AS (
  SELECT l.id,
         ROW_NUMBER() OVER (
           PARTITION BY l.supplier_id
           ORDER BY l.created_at ASC, l.id
         ) AS position
  FROM locations l
  WHERE l.supplier_id IS NOT NULL
)
UPDATE locations l
SET is_main = (ranked.position = 1)
FROM ranked
WHERE ranked.id = l.id
  AND NOT EXISTS (
    SELECT 1 FROM locations existing_main
    WHERE existing_main.supplier_id = l.supplier_id
      AND existing_main.is_main = TRUE
      AND existing_main.id <> l.id
  );

COMMIT;
