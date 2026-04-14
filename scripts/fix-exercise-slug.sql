-- Make slug nullable temporarily to allow inserts
ALTER TABLE exercise_library ALTER COLUMN slug DROP NOT NULL;

-- Update existing rows without slugs
UPDATE exercise_library 
SET slug = LOWER(REGEXP_REPLACE(
  CONCAT(name, '-', COALESCE(equipment, 'none'), '-', COALESCE(gender, 'unisex')),
  '[^a-z0-9]+', '-', 'g'
))
WHERE slug IS NULL;
