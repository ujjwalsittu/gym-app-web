-- Migration 004: Add Offline Features Tables
-- Body measurements, workout notes/journal, routines, templates

-- Body Measurements Table
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  weight_kg DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,1),
  chest_cm DECIMAL(5,1),
  waist_cm DECIMAL(5,1),
  hips_cm DECIMAL(5,1),
  left_arm_cm DECIMAL(5,1),
  right_arm_cm DECIMAL(5,1),
  left_thigh_cm DECIMAL(5,1),
  right_thigh_cm DECIMAL(5,1),
  left_calf_cm DECIMAL(5,1),
  right_calf_cm DECIMAL(5,1),
  neck_cm DECIMAL(5,1),
  shoulders_cm DECIMAL(5,1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_body_measurements_user ON body_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(measured_at);

-- Workout Notes / Journal Table
CREATE TABLE IF NOT EXISTS workout_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type VARCHAR(20) NOT NULL DEFAULT 'note', -- 'note', 'journal', 'workout_note'
  title VARCHAR(200),
  content TEXT NOT NULL,
  mood VARCHAR(20), -- 'great', 'good', 'okay', 'tired', 'exhausted'
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  soreness_level INTEGER CHECK (soreness_level >= 1 AND soreness_level <= 10),
  tags TEXT[], -- Array of tags
  is_private BOOLEAN DEFAULT TRUE,
  synced BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_journal_user ON workout_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_journal_date ON workout_journal(entry_date);
CREATE INDEX IF NOT EXISTS idx_workout_journal_session ON workout_journal(session_id);

-- Warm-up & Cool-down Routines Table
CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  routine_type VARCHAR(20) NOT NULL, -- 'warmup', 'cooldown', 'stretching', 'mobility', 'yoga'
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  difficulty VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  target_areas TEXT[], -- ['shoulders', 'hips', 'legs', 'back', 'full_body']
  exercises JSONB NOT NULL, -- Array of {name, duration_seconds, instructions, animation_key}
  is_system BOOLEAN DEFAULT FALSE, -- System-provided vs user-created
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routines_type ON routines(routine_type);
CREATE INDEX IF NOT EXISTS idx_routines_system ON routines(is_system);

-- User Saved Routines (bookmarks)
CREATE TABLE IF NOT EXISTS user_saved_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, routine_id)
);

-- Workout Templates Table
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'strength', 'cardio', 'hiit', 'full_body', 'upper', 'lower', 'custom'
  difficulty VARCHAR(20) DEFAULT 'intermediate',
  estimated_duration INTEGER, -- minutes
  exercises JSONB NOT NULL, -- Array of {exercise_id, name, sets, reps, rest_seconds, notes}
  warmup_routine_id UUID REFERENCES routines(id) ON DELETE SET NULL,
  cooldown_routine_id UUID REFERENCES routines(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  rating_sum INTEGER DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_templates_user ON workout_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_public ON workout_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_workout_templates_category ON workout_templates(category);

-- User Template Ratings
CREATE TABLE IF NOT EXISTS template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

-- Timer Presets Table (for HIIT, Tabata, etc.)
CREATE TABLE IF NOT EXISTS timer_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  timer_type VARCHAR(20) NOT NULL, -- 'interval', 'tabata', 'amrap', 'emom', 'countdown', 'stopwatch'
  config JSONB NOT NULL, -- {work_seconds, rest_seconds, rounds, etc.}
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timer_presets_user ON timer_presets(user_id);

-- Offline Sync Queue (enhanced)
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
  entity_type VARCHAR(50) NOT NULL, -- 'exercise_log', 'measurement', 'journal', etc.
  entity_id UUID,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_offline_sync_user ON offline_sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_pending ON offline_sync_queue(synced_at) WHERE synced_at IS NULL;

-- Insert default warm-up routines
INSERT INTO routines (name, description, routine_type, duration_minutes, difficulty, target_areas, exercises, is_system) VALUES
('Quick Full Body Warm-up', 'A quick 5-minute warm-up to get your blood flowing', 'warmup', 5, 'beginner', ARRAY['full_body'], 
 '[{"name": "Jumping Jacks", "duration_seconds": 30, "instructions": "Jump feet wide while raising arms overhead"},
   {"name": "Arm Circles", "duration_seconds": 30, "instructions": "Large circles forward then backward"},
   {"name": "Leg Swings", "duration_seconds": 30, "instructions": "Swing each leg front to back"},
   {"name": "Hip Circles", "duration_seconds": 30, "instructions": "Large circles with hips, both directions"},
   {"name": "Torso Twists", "duration_seconds": 30, "instructions": "Rotate upper body left and right"},
   {"name": "High Knees", "duration_seconds": 30, "instructions": "Jog in place bringing knees high"},
   {"name": "Butt Kicks", "duration_seconds": 30, "instructions": "Jog in place kicking heels to glutes"},
   {"name": "Arm Swings", "duration_seconds": 30, "instructions": "Swing arms across chest alternating"},
   {"name": "Ankle Rotations", "duration_seconds": 30, "instructions": "Circle each ankle both directions"},
   {"name": "Light Jog", "duration_seconds": 30, "instructions": "Easy jog in place to finish"}]'::jsonb, TRUE),

('Upper Body Warm-up', 'Prepare shoulders, chest, and arms for lifting', 'warmup', 7, 'beginner', ARRAY['shoulders', 'chest', 'arms'],
 '[{"name": "Arm Circles Small", "duration_seconds": 30, "instructions": "Small circles forward"},
   {"name": "Arm Circles Large", "duration_seconds": 30, "instructions": "Large circles forward then backward"},
   {"name": "Shoulder Shrugs", "duration_seconds": 30, "instructions": "Raise shoulders to ears and release"},
   {"name": "Chest Opener", "duration_seconds": 30, "instructions": "Clasp hands behind back, open chest"},
   {"name": "Tricep Stretch", "duration_seconds": 30, "instructions": "Reach arm overhead, bend elbow"},
   {"name": "Wrist Circles", "duration_seconds": 30, "instructions": "Circle wrists both directions"},
   {"name": "Wall Push-ups", "duration_seconds": 45, "instructions": "Light push-ups against wall"},
   {"name": "Band Pull Aparts", "duration_seconds": 45, "instructions": "Pull band apart at chest level"},
   {"name": "Cat-Cow Stretch", "duration_seconds": 45, "instructions": "Arch and round spine on hands and knees"},
   {"name": "Neck Rolls", "duration_seconds": 30, "instructions": "Gentle neck circles both directions"}]'::jsonb, TRUE),

('Lower Body Warm-up', 'Activate legs, hips, and glutes before leg day', 'warmup', 8, 'beginner', ARRAY['legs', 'hips', 'glutes'],
 '[{"name": "Walking Lunges", "duration_seconds": 45, "instructions": "Step forward into lunge, alternate legs"},
   {"name": "Leg Swings Front", "duration_seconds": 30, "instructions": "Swing leg forward and back"},
   {"name": "Leg Swings Side", "duration_seconds": 30, "instructions": "Swing leg side to side"},
   {"name": "Hip Circles", "duration_seconds": 30, "instructions": "Large circles with hips"},
   {"name": "Glute Bridges", "duration_seconds": 45, "instructions": "Lift hips off ground, squeeze glutes"},
   {"name": "Bodyweight Squats", "duration_seconds": 45, "instructions": "Slow controlled squats"},
   {"name": "Calf Raises", "duration_seconds": 30, "instructions": "Rise onto toes, lower slowly"},
   {"name": "Ankle Circles", "duration_seconds": 30, "instructions": "Circle each ankle"},
   {"name": "Fire Hydrants", "duration_seconds": 45, "instructions": "On all fours, lift leg to side"},
   {"name": "Monster Walks", "duration_seconds": 45, "instructions": "Side steps in squat position"}]'::jsonb, TRUE);

-- Insert default cool-down routines
INSERT INTO routines (name, description, routine_type, duration_minutes, difficulty, target_areas, exercises, is_system) VALUES
('Full Body Cool-down', 'Gentle stretches to recover after any workout', 'cooldown', 10, 'beginner', ARRAY['full_body'],
 '[{"name": "Standing Forward Fold", "duration_seconds": 45, "instructions": "Bend forward, let arms hang"},
   {"name": "Quad Stretch", "duration_seconds": 45, "instructions": "Pull heel to glute, each leg"},
   {"name": "Hamstring Stretch", "duration_seconds": 45, "instructions": "Extend leg, reach for toes"},
   {"name": "Hip Flexor Stretch", "duration_seconds": 45, "instructions": "Lunge position, push hips forward"},
   {"name": "Chest Stretch", "duration_seconds": 30, "instructions": "Arm against wall, turn away"},
   {"name": "Shoulder Stretch", "duration_seconds": 30, "instructions": "Pull arm across chest"},
   {"name": "Tricep Stretch", "duration_seconds": 30, "instructions": "Reach arm overhead, bend elbow"},
   {"name": "Cat-Cow Stretch", "duration_seconds": 45, "instructions": "Arch and round spine"},
   {"name": "Childs Pose", "duration_seconds": 60, "instructions": "Kneel, reach arms forward, relax"},
   {"name": "Lying Spinal Twist", "duration_seconds": 45, "instructions": "Knees to side, look opposite"},
   {"name": "Deep Breathing", "duration_seconds": 60, "instructions": "Slow deep breaths, relax completely"}]'::jsonb, TRUE),

('Post-Cardio Stretch', 'Cool down after running or HIIT', 'cooldown', 8, 'beginner', ARRAY['legs', 'hips'],
 '[{"name": "Walking", "duration_seconds": 60, "instructions": "Slow walk to lower heart rate"},
   {"name": "Standing Quad Stretch", "duration_seconds": 45, "instructions": "Pull heel to glute"},
   {"name": "Standing Calf Stretch", "duration_seconds": 45, "instructions": "Step back, press heel down"},
   {"name": "Standing Hamstring Stretch", "duration_seconds": 45, "instructions": "Foot on raised surface, lean forward"},
   {"name": "Hip Flexor Stretch", "duration_seconds": 45, "instructions": "Lunge, push hips forward"},
   {"name": "IT Band Stretch", "duration_seconds": 45, "instructions": "Cross legs, lean to side"},
   {"name": "Seated Forward Fold", "duration_seconds": 45, "instructions": "Legs extended, reach for toes"},
   {"name": "Butterfly Stretch", "duration_seconds": 45, "instructions": "Soles together, press knees down"},
   {"name": "Lying Glute Stretch", "duration_seconds": 45, "instructions": "Figure 4 position, pull knee"},
   {"name": "Deep Breathing", "duration_seconds": 45, "instructions": "Slow breaths, full recovery"}]'::jsonb, TRUE);

-- Insert default timer presets
INSERT INTO timer_presets (name, timer_type, config, is_system) VALUES
('Classic Tabata', 'tabata', '{"work_seconds": 20, "rest_seconds": 10, "rounds": 8, "sets": 1, "set_rest_seconds": 60}'::jsonb, TRUE),
('30/30 Intervals', 'interval', '{"work_seconds": 30, "rest_seconds": 30, "rounds": 10}'::jsonb, TRUE),
('45/15 Intervals', 'interval', '{"work_seconds": 45, "rest_seconds": 15, "rounds": 10}'::jsonb, TRUE),
('EMOM 10 Minutes', 'emom', '{"interval_seconds": 60, "total_minutes": 10}'::jsonb, TRUE),
('AMRAP 15 Minutes', 'amrap', '{"total_minutes": 15}'::jsonb, TRUE),
('5 Minute Countdown', 'countdown', '{"total_seconds": 300}'::jsonb, TRUE),
('Rest Timer 90s', 'countdown', '{"total_seconds": 90}'::jsonb, TRUE),
('Rest Timer 2min', 'countdown', '{"total_seconds": 120}'::jsonb, TRUE);
