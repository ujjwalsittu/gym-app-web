import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

// Type definitions for database tables
export interface User {
  id: string
  email: string
  password_hash: string
  created_at: Date
  updated_at: Date
}

export interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  age: number | null
  gender: string | null
  height_cm: number | null
  weight_kg: number | null
  target_weight_kg: number | null
  activity_level: string | null
  sleep_hours: number | null
  water_intake_liters: number | null
  smoking_status: string | null
  alcohol_status: string | null
  diet_type: string | null
  food_allergies: string[] | null
  meals_per_day: number | null
  fitness_goal: string | null
  workout_experience: string | null
  preferred_workout_days: number | null
  workout_duration_minutes: number | null
  medical_conditions: string[] | null
  injuries: string[] | null
  country: string | null
  state: string | null
  city: string | null
  timezone: string | null
  onboarding_completed: boolean
  onboarding_step: number
  created_at: Date
  updated_at: Date
}

export interface BodyPhoto {
  id: string
  user_id: string
  photo_type: 'front' | 'left' | 'right'
  blob_url: string
  ai_analysis: Record<string, unknown> | null
  uploaded_at: Date
}

export interface WorkoutPlan {
  id: string
  user_id: string
  plan_data: WorkoutPlanData
  ai_reasoning: string | null
  is_active: boolean
  created_at: Date
  valid_until: Date | null
}

export interface WorkoutPlanData {
  name: string
  description: string
  weeks: number
  days: WorkoutDay[]
}

export interface WorkoutDay {
  day: string
  name: string
  focus: string
  exercises: Exercise[]
  restDay?: boolean
}

export interface Exercise {
  name: string
  sets: number
  reps: string
  rest: string
  notes?: string
  animationKey?: string
}

export interface DietPlan {
  id: string
  user_id: string
  plan_data: DietPlanData
  daily_calories: number
  macros: {
    protein: number
    carbs: number
    fats: number
  }
  ai_reasoning: string | null
  is_active: boolean
  created_at: Date
}

export interface DietPlanData {
  meals: Meal[]
  snacks: string[]
  hydration: string
  supplements?: string[]
}

export interface Meal {
  name: string
  time: string
  foods: string[]
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface WorkoutSession {
  id: string
  user_id: string
  workout_plan_id: string
  day_of_week: string
  session_date: Date
  started_at: Date | null
  completed_at: Date | null
  gym_verification_video: string | null
  gym_verified: boolean
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
}

export interface ExerciseLog {
  id: string
  session_id: string
  exercise_name: string
  set_number: number
  target_reps: number | null
  actual_reps: number | null
  target_weight_kg: number | null
  actual_weight_kg: number | null
  duration_seconds: number | null
  completed_at: Date | null
  notes: string | null
}

export interface DailyLog {
  id: string
  user_id: string
  log_date: Date
  water_intake_ml: number
  sleep_hours: number | null
  weight_kg: number | null
  mood: string | null
  energy_level: number | null
  notes: string | null
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: Date
  created_at: Date
}
