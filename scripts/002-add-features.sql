-- VisionaryFit Database Schema - Phase 2 Features
-- New tables for: PRs, Achievements, Chat History, Recipes, Telegram

-- Personal Records (PRs)
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255) NOT NULL,
  record_type VARCHAR(50) NOT NULL, -- 'weight', 'reps', 'duration', 'volume'
  record_value DECIMAL(10,2) NOT NULL,
  previous_value DECIMAL(10,2),
  achieved_at TIMESTAMP DEFAULT NOW(),
  session_id UUID REFERENCES workout_sessions(id),
  UNIQUE(user_id, exercise_name, record_type)
);

-- Achievements & Badges
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  category VARCHAR(50), -- 'streak', 'strength', 'consistency', 'milestone'
  requirement_type VARCHAR(50),
  requirement_value INTEGER,
  points INTEGER DEFAULT 10
);

-- User Achievements (Earned)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- AI Coach Chat History
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved Recipes
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  calories_per_serving INTEGER,
  macros JSONB, -- {protein, carbs, fat, fiber}
  tags TEXT[],
  image_url TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Telegram Integration
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  telegram_chat_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(255),
  connected_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP
);

-- Offline Cache Metadata
CREATE TABLE IF NOT EXISTS offline_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cache_type VARCHAR(50) NOT NULL, -- 'workout_plan', 'diet_plan', 'exercises'
  cache_key VARCHAR(255) NOT NULL,
  cached_data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  UNIQUE(user_id, cache_type, cache_key)
);

-- Exercise Library (for offline animations)
CREATE TABLE IF NOT EXISTS exercise_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'upper_body', 'lower_body', 'core', 'cardio', 'stretching'
  muscle_groups TEXT[],
  equipment TEXT[],
  difficulty VARCHAR(20),
  instructions JSONB,
  animation_data JSONB, -- Lottie JSON data
  tips TEXT[],
  common_mistakes TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  streak_type VARCHAR(50) NOT NULL, -- 'workout', 'water', 'login'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Insert default achievements
INSERT INTO achievements (code, name, description, icon, category, requirement_type, requirement_value, points) VALUES
-- Streak Achievements
('first_workout', 'First Step', 'Complete your first workout', 'trophy', 'milestone', 'workouts_completed', 1, 10),
('streak_3', 'Getting Started', 'Maintain a 3-day workout streak', 'flame', 'streak', 'streak_days', 3, 20),
('streak_7', 'Week Warrior', 'Maintain a 7-day workout streak', 'flame', 'streak', 'streak_days', 7, 50),
('streak_14', 'Two Week Champion', 'Maintain a 14-day workout streak', 'flame', 'streak', 'streak_days', 14, 100),
('streak_30', 'Monthly Master', 'Maintain a 30-day workout streak', 'crown', 'streak', 'streak_days', 30, 200),
('streak_100', 'Centurion', 'Maintain a 100-day workout streak', 'star', 'streak', 'streak_days', 100, 500),
-- Workout Milestones
('workouts_10', 'Dedicated', 'Complete 10 workouts', 'dumbbell', 'milestone', 'workouts_completed', 10, 30),
('workouts_50', 'Committed', 'Complete 50 workouts', 'dumbbell', 'milestone', 'workouts_completed', 50, 100),
('workouts_100', 'Century Club', 'Complete 100 workouts', 'medal', 'milestone', 'workouts_completed', 100, 250),
('workouts_365', 'Year Strong', 'Complete 365 workouts', 'trophy', 'milestone', 'workouts_completed', 365, 1000),
-- Strength PRs
('first_pr', 'Personal Best', 'Set your first personal record', 'target', 'strength', 'prs_set', 1, 25),
('pr_breaker_5', 'PR Crusher', 'Break 5 personal records', 'lightning', 'strength', 'prs_set', 5, 75),
('pr_breaker_25', 'Record Destroyer', 'Break 25 personal records', 'lightning', 'strength', 'prs_set', 25, 200),
-- Consistency
('early_bird', 'Early Bird', 'Complete a workout before 7 AM', 'sun', 'consistency', 'early_workout', 1, 15),
('night_owl', 'Night Owl', 'Complete a workout after 9 PM', 'moon', 'consistency', 'late_workout', 1, 15),
('gym_verified_10', 'Gym Regular', 'Verify gym check-in 10 times', 'check-circle', 'consistency', 'gym_verifications', 10, 50),
-- Hydration
('hydration_streak_7', 'Hydration Hero', 'Log water intake for 7 consecutive days', 'droplet', 'consistency', 'water_streak', 7, 30),
-- Weight
('weight_goal_reached', 'Goal Achieved', 'Reach your target weight', 'trophy', 'milestone', 'weight_goal', 1, 500)
ON CONFLICT (code) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_personal_records_user ON personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(user_id, exercise_name);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON telegram_users(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_offline_cache_user ON offline_cache(user_id, cache_type);
CREATE INDEX IF NOT EXISTS idx_exercise_library_category ON exercise_library(category);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
