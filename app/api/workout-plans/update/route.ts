import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { reason, changes } = await request.json()

    // Get current workout plan
    const plan = await sql`
      SELECT id, days_per_week, fitness_level FROM workout_plans
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (!plan.length) {
      return NextResponse.json({ error: 'No active workout plan found' }, { status: 404 })
    }

    const planId = plan[0].id

    // Determine if difficulty should change based on weight loss/gain or progress
    let newDifficulty = 'intermediate'
    
    if (reason === 'weight_loss') {
      newDifficulty = 'intermediate' // Keep or increase intensity for weight loss
    } else if (reason === 'weight_gain') {
      newDifficulty = 'beginner' // Reduce intensity for weight gain
    } else if (reason === 'progress_photos') {
      newDifficulty = 'advanced' // Increase intensity if photos show progress
    }

    // Get new exercises with updated difficulty
    const userProfile = await sql`
      SELECT gender FROM user_profiles WHERE user_id = ${userId}
    `

    if (!userProfile.length) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const newExercises = await sql`
      SELECT id, name, category FROM exercise_library
      WHERE gender = ${userProfile[0].gender}
      AND difficulty = ${newDifficulty}
      AND is_active = true
      AND lottie_data IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 20
    `

    // Update workout plan exercises
    await sql`
      DELETE FROM workout_plan_exercises 
      WHERE day_id IN (SELECT id FROM workout_plan_days WHERE plan_id = ${planId})
    `

    const workoutDays = await sql`
      SELECT id FROM workout_plan_days WHERE plan_id = ${planId}
    `

    let exerciseIdx = 0
    for (const day of workoutDays) {
      for (let i = 0; i < 5 && exerciseIdx < newExercises.length; i++) {
        await sql`
          INSERT INTO workout_plan_exercises (id, day_id, exercise_id, created_at)
          VALUES (gen_random_uuid(), ${day.id}, ${newExercises[exerciseIdx].id}, NOW())
        `
        exerciseIdx++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Workout plan updated based on ${reason}`,
      newDifficulty,
      exercisesUpdated: newExercises.length
    })
  } catch (error) {
    console.error('Error updating workout plan:', error)
    return NextResponse.json({ error: 'Failed to update workout plan' }, { status: 500 })
  }
}
