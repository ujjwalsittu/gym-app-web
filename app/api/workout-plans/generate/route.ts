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
    const { name, daysPerWeek, skipDays, goal } = await request.json()

    if (!name || !daysPerWeek || !skipDays || !Array.isArray(skipDays)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Get user profile for gender and fitness level
    const userProfile = await sql`
      SELECT gender, fitness_level FROM user_profiles WHERE user_id = ${userId}
    `

    if (!userProfile.length) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const gender = userProfile[0].gender
    const fitnessLevel = userProfile[0].fitness_level || 'beginner'

    // Get exercises matching user criteria (gender, fitness level)
    const allExercises = await sql`
      SELECT id, name, category, equipment, difficulty, lottie_data 
      FROM exercise_library 
      WHERE is_active = true 
      AND gender = ${gender}
      AND difficulty = ${fitnessLevel}
      AND lottie_data IS NOT NULL
      ORDER BY category, RANDOM()
    `

    if (allExercises.length === 0) {
      return NextResponse.json({ 
        error: 'No exercises found for your profile. Please update your preferences.' 
      }, { status: 400 })
    }

    // Generate workout plan with exercises distributed across days
    const workoutDays = []
    const daysInWeek = 7
    const actualSkipDays = skipDays.filter((d: number) => d >= 0 && d < daysInWeek)
    const workoutDaysOfWeek = Array.from({ length: daysInWeek }, (_, i) => i).filter(
      (day) => !actualSkipDays.includes(day)
    )

    // Group exercises by category for variety
    const exercisesByCategory: Record<string, any[]> = {}
    allExercises.forEach((ex: any) => {
      if (!exercisesByCategory[ex.category]) {
        exercisesByCategory[ex.category] = []
      }
      exercisesByCategory[ex.category].push(ex)
    })

    let exerciseIndex = 0
    const categoriesArray = Object.keys(exercisesByCategory)

    for (const dayOfWeek of workoutDaysOfWeek) {
      const dayExercises = []
      const exercisesPerDay = Math.max(4, Math.floor(allExercises.length / daysPerWeek))

      for (let i = 0; i < exercisesPerDay && exerciseIndex < allExercises.length; i++) {
        const categoryIdx = (exerciseIndex % categoriesArray.length)
        const category = categoriesArray[categoryIdx]
        const categoryExercises = exercisesByCategory[category]

        if (categoryExercises.length > 0) {
          const exercise = categoryExercises.pop()
          if (exercise) {
            dayExercises.push(exercise.id)
          }
        }
        exerciseIndex++
      }

      if (dayExercises.length > 0) {
        workoutDays.push({
          day: dayOfWeek,
          exercises: dayExercises
        })
      }
    }

    // Create workout plan record
    const plan = await sql`
      INSERT INTO workout_plans (
        id, user_id, name, description, days_per_week, 
        skip_days, created_at, updated_at, is_active
      )
      VALUES (
        gen_random_uuid(),
        ${userId},
        ${name},
        ${'Generated on ' + new Date().toLocaleDateString()},
        ${daysPerWeek},
        ${JSON.stringify(actualSkipDays)},
        NOW(),
        NOW(),
        true
      )
      RETURNING id, name, days_per_week, skip_days
    `

    const planId = plan[0].id

    // Insert workout days and exercises
    for (const day of workoutDays) {
      await sql`
        INSERT INTO workout_plan_days (id, plan_id, day_of_week, created_at)
        VALUES (gen_random_uuid(), ${planId}, ${day.day}, NOW())
      `
    }

    return NextResponse.json({
      success: true,
      plan: plan[0],
      workoutDaysCount: workoutDays.length,
      exercisesTotal: allExercises.length
    })
  } catch (error) {
    console.error('Error generating workout plan:', error)
    return NextResponse.json({ error: 'Failed to generate workout plan' }, { status: 500 })
  }
}
