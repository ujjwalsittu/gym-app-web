-- Drop and recreate exercise_library table with proper structure for Lottie animations
DROP TABLE IF EXISTS exercise_library CASCADE;

CREATE TABLE exercise_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- Body part: ABS, ARMS, BACK, CHEST, LEGS, SHOULDERS, CARDIO
  equipment VARCHAR(100) NOT NULL, -- Band, Barbell, Bodyweight, Cable, Dumbbell, Kettlebell, Machine, etc.
  gender VARCHAR(20) DEFAULT 'unisex', -- Men, Women, unisex
  difficulty VARCHAR(50) DEFAULT 'intermediate', -- beginner, intermediate, advanced
  muscle_groups TEXT[] DEFAULT '{}', -- Primary muscles targeted
  secondary_muscles TEXT[] DEFAULT '{}', -- Secondary muscles
  instructions TEXT[] DEFAULT '{}', -- Step by step instructions
  tips TEXT[] DEFAULT '{}', -- Pro tips
  lottie_url TEXT, -- URL to Lottie JSON file in Blob storage
  thumbnail_url TEXT, -- Optional thumbnail image
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_exercise_library_category ON exercise_library(category);
CREATE INDEX idx_exercise_library_equipment ON exercise_library(equipment);
CREATE INDEX idx_exercise_library_gender ON exercise_library(gender);
CREATE INDEX idx_exercise_library_slug ON exercise_library(slug);
CREATE INDEX idx_exercise_library_name ON exercise_library(name);
CREATE INDEX idx_exercise_library_active ON exercise_library(is_active);

-- Full text search index
CREATE INDEX idx_exercise_library_search ON exercise_library USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
