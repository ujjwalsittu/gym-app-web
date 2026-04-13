import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { OnboardingData } from '@/lib/onboarding-store'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: OnboardingData = await request.json()
    const userId = session.user.id

    // Map onboarding data to user_profiles columns (matching actual DB schema)
    // user_profiles columns: age, gender, height_cm, weight_kg, target_weight_kg, 
    // activity_level, sleep_hours, diet_type, meals_per_day, water_intake_liters,
    // fitness_goal, workout_duration_minutes, preferred_workout_days, workout_experience,
    // medical_conditions, injuries, food_allergies, country, state, city, timezone,
    // smoking_status, alcohol_status, full_name, onboarding_completed, onboarding_step

    await sql`
      UPDATE user_profiles SET
        age = ${data.age},
        gender = ${data.gender},
        height_cm = ${data.height},
        weight_kg = ${data.weight},
        target_weight_kg = ${data.targetWeight},
        activity_level = ${data.activityLevel},
        sleep_hours = ${data.sleepHours},
        diet_type = ${data.dietType},
        meals_per_day = ${data.mealsPerDay},
        water_intake_liters = ${data.waterIntake ? data.waterIntake * 0.25 : null},
        fitness_goal = ${data.primaryGoal},
        workout_duration_minutes = ${data.workoutDuration},
        preferred_workout_days = ${data.workoutDaysPerWeek},
        medical_conditions = ${data.medicalConditions},
        injuries = ${data.injuries},
        food_allergies = ${data.allergies},
        country = ${data.country},
        state = ${data.state},
        city = ${data.city},
        timezone = ${data.timezone},
        smoking_status = ${data.smokingStatus},
        alcohol_status = ${data.alcoholConsumption},
        onboarding_completed = true,
        updated_at = NOW()
      WHERE user_id = ${userId}
    `

    // Save body photos if provided (body_photos table has: user_id, photo_type, blob_url)
    if (data.photoFront) {
      await sql`
        INSERT INTO body_photos (user_id, photo_type, blob_url)
        VALUES (${userId}, 'front', ${data.photoFront})
        ON CONFLICT DO NOTHING
      `
    }
    if (data.photoLeft) {
      await sql`
        INSERT INTO body_photos (user_id, photo_type, blob_url)
        VALUES (${userId}, 'left', ${data.photoLeft})
        ON CONFLICT DO NOTHING
      `
    }
    if (data.photoRight) {
      await sql`
        INSERT INTO body_photos (user_id, photo_type, blob_url)
        VALUES (${userId}, 'right', ${data.photoRight})
        ON CONFLICT DO NOTHING
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    )
  }
}
