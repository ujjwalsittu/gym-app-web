-- VisionaryFit Database Schema
-- Phase 1: Core Tables

-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Profile (Onboarding Data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  -- Basic Info
  full_name VARCHAR(255),
  age INTEGER,
  gender VARCHAR(20),
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  target_weight_kg DECIMAL(5,2),
  
  -- Lifestyle
  activity_level VARCHAR(50),
  sleep_hours DECIMAL(3,1),
  water_intake_liters DECIMAL(3,1),
  
  -- Habits
  smoking_status VARCHAR(30),
  alcohol_status VARCHAR(30),
  
  -- Diet
  diet_type VARCHAR(50),
  food_allergies TEXT[],
  meals_per_day INTEGER,
  
  -- Fitness Goals
  fitness_goal VARCHAR(50),
  workout_experience VARCHAR(30),
  preferred_workout_days INTEGER,
  workout_duration_minutes INTEGER,
  
  -- Medical
  medical_conditions TEXT[],
  injuries TEXT[],
  
  -- Location
  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(100),
  timezone VARCHAR(50),
  
  -- Onboarding status
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Body Photos (Front, Left, Right)
CREATE TABLE IF NOT EXISTS body_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  photo_type VARCHAR(20) NOT NULL,
  blob_url TEXT NOT NULL,
  ai_analysis JSONB,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- AI Generated Workout Plans
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,
  ai_reasoning TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP
);

-- AI Generated Diet Plans
CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,
  daily_calories INTEGER,
  macros JSONB,
  ai_reasoning TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workout Sessions & Tracking
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES workout_plans(id),
  day_of_week VARCHAR(20),
  session_date DATE NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  gym_verification_video TEXT,
  gym_verified BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending'
);

-- Exercise Logs (Individual Sets)
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255) NOT NULL,
  set_number INTEGER NOT NULL,
  target_reps INTEGER,
  actual_reps INTEGER,
  target_weight_kg DECIMAL(5,2),
  actual_weight_kg DECIMAL(5,2),
  duration_seconds INTEGER,
  completed_at TIMESTAMP,
  notes TEXT
);

-- Daily Logs (Water, Sleep, etc.)
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  water_intake_ml INTEGER DEFAULT 0,
  sleep_hours DECIMAL(3,1),
  weight_kg DECIMAL(5,2),
  mood VARCHAR(20),
  energy_level INTEGER,
  notes TEXT,
  UNIQUE(user_id, log_date)
);

-- Push Notification Subscriptions (Phase 3)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reminder Settings (Phase 3)
CREATE TABLE IF NOT EXISTS reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  times TIME[],
  days_of_week INTEGER[],
  messaging_channel VARCHAR(20)[]
);

-- Sessions table for auth
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_body_photos_user_id ON body_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_id ON exercise_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
