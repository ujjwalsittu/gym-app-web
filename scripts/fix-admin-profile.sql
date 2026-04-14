-- Fix admin user profile
-- First check if admin user exists without a profile

-- Insert profile for admin users that don't have one
INSERT INTO user_profiles (user_id, full_name, onboarding_completed, onboarding_step, created_at, updated_at)
SELECT u.id, 'Admin User', true, 9, NOW(), NOW()
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.is_admin = true AND p.id IS NULL;

-- Update existing admin profiles to have onboarding completed
UPDATE user_profiles 
SET onboarding_completed = true, onboarding_step = 9
WHERE user_id IN (SELECT id FROM users WHERE is_admin = true);
