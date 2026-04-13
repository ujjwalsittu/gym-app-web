import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@vercel/postgres'

export async function POST() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Reset user profile to initial state
    await sql`
      UPDATE user_profiles 
      SET 
        age = NULL,
        gender = NULL,
        height_cm = NULL,
        weight_kg = NULL,
        target_weight_kg = NULL,
        activity_level = 'sedentary',
        sleep_hours = 7,
        diet_type = NULL,
        meals_per_day = 3,
        water_intake_liters = 2,
        fitness_goal = NULL,
        preferred_workout_days = NULL,
        workout_experience = 'beginner',
        city = NULL,
        state = NULL,
        country = NULL,
        medical_conditions = '[]',
        injuries = '[]',
        food_allergies = '[]',
        onboarding_completed = false,
        onboarding_step = 1,
        updated_at = NOW()
      WHERE user_id = ${userId}
    `

    return NextResponse.json({ success: true, message: 'Profile reset successfully' })
  } catch (error) {
    console.error('Profile reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset profile' },
      { status: 500 }
    )
  }
}
