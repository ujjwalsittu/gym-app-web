-- Add user equipment table for available gym equipment
CREATE TABLE IF NOT EXISTS user_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equipment_name VARCHAR(100) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, equipment_name)
);

-- Add skip_days column to workout_plans
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS skip_days INTEGER[] DEFAULT '{}';
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS workout_days INTEGER DEFAULT 5;
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS preferred_days VARCHAR(20)[] DEFAULT '{}';

-- Add lottie_data column to exercise_library if not exists
ALTER TABLE exercise_library ADD COLUMN IF NOT EXISTS lottie_data JSONB;

-- Create weight_logs table for tracking weight updates
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2) NOT NULL,
  logged_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_equipment_user ON user_equipment(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user ON weight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_active ON workout_plans(user_id, is_active);

-- Cleanup test user data
DELETE FROM body_photos WHERE user_id = '7c8430ae-6a72-44e9-98dc-66b0596591dd';
DELETE FROM workout_sessions WHERE user_id = '7c8430ae-6a72-44e9-98dc-66b0596591dd';
DELETE FROM sessions WHERE user_id = '7c8430ae-6a72-44e9-98dc-66b0596591dd';
DELETE FROM user_profiles WHERE user_id = '7c8430ae-6a72-44e9-98dc-66b0596591dd';
DELETE FROM users WHERE id = '7c8430ae-6a72-44e9-98dc-66b0596591dd';
