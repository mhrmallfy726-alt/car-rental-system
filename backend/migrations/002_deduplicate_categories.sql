-- Prevent duplicate category names created by repeated schema initialization.
-- Keep the oldest row and repoint cars before removing duplicate rows.
WITH ranked_categories AS (
  SELECT
    id,
    FIRST_VALUE(id) OVER (
      PARTITION BY LOWER(TRIM(name))
      ORDER BY created_at ASC NULLS LAST, id
    ) AS keep_id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(name))
      ORDER BY created_at ASC NULLS LAST, id
    ) AS row_number
  FROM categories
)
UPDATE cars
SET category_id = ranked_categories.keep_id
FROM ranked_categories
WHERE cars.category_id = ranked_categories.id
  AND ranked_categories.row_number > 1;

WITH ranked_categories AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(name))
      ORDER BY created_at ASC NULLS LAST, id
    ) AS row_number
  FROM categories
)
DELETE FROM categories
WHERE id IN (
  SELECT id FROM ranked_categories WHERE row_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_unique_idx
  ON categories (LOWER(TRIM(name)));
