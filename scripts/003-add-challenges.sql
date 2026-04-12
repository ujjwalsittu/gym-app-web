-- Add challenges and leaderboards tables
-- Migration 003

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  challenge_type VARCHAR(50) NOT NULL, -- 'workout_count', 'minutes', 'calories', 'streak', 'weight_lifted'
  target_value INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  reward_points INTEGER DEFAULT 0,
  reward_badge VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User challenge participation
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Leaderboard entries (cached/computed)
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_type VARCHAR(50) NOT NULL, -- 'weekly_workouts', 'monthly_minutes', 'total_volume', 'streak'
  period_start DATE,
  period_end DATE,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, leaderboard_type, period_start)
);

-- Insert default weekly/monthly challenges
INSERT INTO challenges (name, description, challenge_type, target_value, start_date, end_date, reward_points, reward_badge)
VALUES 
  ('Week Warrior', 'Complete 5 workouts this week', 'workout_count', 5, DATE_TRUNC('week', CURRENT_DATE), DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days', 100, 'week_warrior'),
  ('Hour Hero', 'Log 300 minutes of exercise this month', 'minutes', 300, DATE_TRUNC('month', CURRENT_DATE), (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE, 200, 'hour_hero'),
  ('Iron Will', 'Lift 10,000 kg total this week', 'weight_lifted', 10000, DATE_TRUNC('week', CURRENT_DATE), DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days', 150, 'iron_will'),
  ('Consistency King', 'Maintain a 7-day workout streak', 'streak', 7, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 250, 'consistency_king'),
  ('Calorie Crusher', 'Burn 2000 calories this week', 'calories', 2000, DATE_TRUNC('week', CURRENT_DATE), DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days', 150, 'calorie_crusher')
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_type_period ON leaderboard_entries(leaderboard_type, period_start);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_entries(leaderboard_type, rank);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active, start_date, end_date);
