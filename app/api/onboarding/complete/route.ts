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

    console.log('[v0] Saving onboarding data for user:', userId)
    await sql`
      INSERT INTO user_profiles (
        user_id,
        age,
        gender,
        height_cm,
        weight_kg,
        target_weight_kg,
        activity_level,
        sleep_hours,
        occupation,
        stress_level,
        diet_type,
        meals_per_day,
        water_intake_glasses,
        supplements,
        smoking_status,
        alcohol_consumption,
        caffeine_intake,
        primary_goal,
        workout_days_per_week,
        workout_duration_minutes,
        gym_access,
        equipment_at_home,
        medical_conditions,
        injuries,
        medications,
        allergies,
        country,
        state,
        city,
        timezone
      )
      VALUES (
        ${userId},
        ${data.age},
        ${data.gender},
        ${data.height},
        ${data.weight},
        ${data.targetWeight},
        ${data.activityLevel},
        ${data.sleepHours},
        ${data.occupation},
        ${data.stressLevel},
        ${data.dietType},
        ${data.mealsPerDay},
        ${data.waterIntake},
        ${JSON.stringify(data.supplements)},
        ${data.smokingStatus},
        ${data.alcoholConsumption},
        ${data.caffeineIntake},
        ${data.primaryGoal},
        ${data.workoutDaysPerWeek},
        ${data.workoutDuration},
        ${data.gymAccess},
        ${JSON.stringify(data.equipmentAtHome)},
        ${JSON.stringify(data.medicalConditions)},
        ${JSON.stringify(data.injuries)},
        ${JSON.stringify(data.medications)},
        ${JSON.stringify(data.allergies)},
        ${data.country},
        ${data.state},
        ${data.city},
        ${data.timezone}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        height_cm = EXCLUDED.height_cm,
        weight_kg = EXCLUDED.weight_kg,
        target_weight_kg = EXCLUDED.target_weight_kg,
        activity_level = EXCLUDED.activity_level,
        sleep_hours = EXCLUDED.sleep_hours,
        occupation = EXCLUDED.occupation,
        stress_level = EXCLUDED.stress_level,
        diet_type = EXCLUDED.diet_type,
        meals_per_day = EXCLUDED.meals_per_day,
        water_intake_glasses = EXCLUDED.water_intake_glasses,
        supplements = EXCLUDED.supplements,
        smoking_status = EXCLUDED.smoking_status,
        alcohol_consumption = EXCLUDED.alcohol_consumption,
        caffeine_intake = EXCLUDED.caffeine_intake,
        primary_goal = EXCLUDED.primary_goal,
        workout_days_per_week = EXCLUDED.workout_days_per_week,
        workout_duration_minutes = EXCLUDED.workout_duration_minutes,
        gym_access = EXCLUDED.gym_access,
        equipment_at_home = EXCLUDED.equipment_at_home,
        medical_conditions = EXCLUDED.medical_conditions,
        injuries = EXCLUDED.injuries,
        medications = EXCLUDED.medications,
        allergies = EXCLUDED.allergies,
        country = EXCLUDED.country,
        state = EXCLUDED.state,
        city = EXCLUDED.city,
        timezone = EXCLUDED.timezone,
        updated_at = NOW()
    `

    // Save body photos
    if (data.photoFront || data.photoLeft || data.photoRight) {
      await sql`
        INSERT INTO body_photos (user_id, photo_front_url, photo_left_url, photo_right_url)
        VALUES (
          ${userId},
          ${data.photoFront},
          ${data.photoLeft},
          ${data.photoRight}
        )
      `
    }

    console.log('[v0] Onboarding profile updated successfully')

    // Mark onboarding as complete in user_profiles
    await sql`
      UPDATE user_profiles 
      SET onboarding_completed = true, updated_at = NOW()
      WHERE user_id = ${userId}
    `

    console.log('[v0] Marked onboarding as complete')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    )
  }
}
