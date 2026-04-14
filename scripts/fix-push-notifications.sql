-- Fix push_subscriptions table to match API expectations
ALTER TABLE push_subscriptions 
  ADD COLUMN IF NOT EXISTS p256dh_key TEXT,
  ADD COLUMN IF NOT EXISTS auth_key TEXT;

-- Migrate existing keys from jsonb to separate columns if needed
UPDATE push_subscriptions 
SET 
  p256dh_key = keys->>'p256dh',
  auth_key = keys->>'auth'
WHERE keys IS NOT NULL 
  AND (p256dh_key IS NULL OR auth_key IS NULL);

-- Add unique constraint on endpoint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'push_subscriptions_endpoint_key'
  ) THEN
    ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
  END IF;
END$$;

-- Drop old reminder_settings and recreate with correct schema
DROP TABLE IF EXISTS reminder_settings CASCADE;

CREATE TABLE reminder_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  water_reminder BOOLEAN DEFAULT true,
  water_interval_minutes INTEGER DEFAULT 60,
  workout_reminder BOOLEAN DEFAULT true,
  workout_time VARCHAR(5) DEFAULT '07:00',
  walk_reminder BOOLEAN DEFAULT true,
  walk_interval_hours INTEGER DEFAULT 2,
  meal_reminders BOOLEAN DEFAULT true,
  meal_times JSONB DEFAULT '["08:00", "13:00", "19:00"]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_reminder_settings_user ON reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
