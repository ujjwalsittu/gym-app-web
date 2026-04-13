-- Update exercise_library table for video support
-- Add columns if they don't exist

ALTER TABLE exercise_library 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS equipment TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exercise_library_category ON exercise_library(category);
CREATE INDEX IF NOT EXISTS idx_exercise_library_subcategory ON exercise_library(subcategory);
CREATE INDEX IF NOT EXISTS idx_exercise_library_equipment ON exercise_library(equipment);
CREATE INDEX IF NOT EXISTS idx_exercise_library_name ON exercise_library(name);
