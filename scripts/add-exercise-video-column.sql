-- Add video_url column to exercise_library table
ALTER TABLE exercise_library ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add subcategory column for better organization
ALTER TABLE exercise_library ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);

-- Create index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_exercise_library_name ON exercise_library(name);
CREATE INDEX IF NOT EXISTS idx_exercise_library_category ON exercise_library(category);
