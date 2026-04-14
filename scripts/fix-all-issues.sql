-- Fix workout_plans table - add missing columns
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS days_per_week INTEGER DEFAULT 4;
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS plan_data JSONB;
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS plan_status VARCHAR(50) DEFAULT 'active';

-- Create admin_settings table for persistent admin settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Create workout_exercises table for logging individual exercise sets
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercise_library(id),
  exercise_name VARCHAR(255) NOT NULL,
  sets_completed INTEGER DEFAULT 0,
  reps_data JSONB, -- Array of {reps: number, weight: number}
  duration_seconds INTEGER,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workout_exercises_user_id ON workout_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session_id ON workout_exercises(workout_session_id);

-- Clean up redundant columns in push_subscriptions (keep both for backward compat)
-- No changes needed - the migration already handles both formats
