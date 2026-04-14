import { NextResponse } from 'next/server'
import { generateText, Output } from 'ai'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'
import { z } from 'zod'

const WorkoutPlanSchema = z.object({
  planName: z.string(),
  daysPerWeek: z.number(),
  skipDays: z.array(z.number()),
  workoutDays: z.array(
    z.object({
      dayOfWeek: z.number(),
      dayName: z.string(),
      focus: z.string(),
      warmup: z.object({
        exercise: z.string(),
        duration: z.string(),
        instructions: z.array(z.string())
      }),
      exercises: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          category: z.string(),
          equipment: z.string(),
          sets: z.number(),
          reps: z.string(),
          restSeconds: z.number(),
          instructions: z.array(z.string()),
          tips: z.array(z.string()),
          difficulty: z.string()
        })
      ),
      cooldown: z.object({
        exercise: z.string(),
        duration: z.string(),
        instructions: z.array(z.string())
      }),
      notes: z.string()
    })
  )
})

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

    // Get user profile
    const userProfile = await sql`
      SELECT gender, fitness_level, goal, equipment_at_home 
      FROM user_profiles WHERE user_id = ${userId}
    `

    if (!userProfile.length) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { gender, fitness_level: fitnessLevel, equipment_at_home: equipment } = userProfile[0]

    // Get all available exercises for this user
    const allExercises = await sql`
      SELECT 
        id, name, category, equipment, difficulty, 
        instructions, tips, lottie_data
      FROM exercise_library 
      WHERE is_active = true 
        AND gender = ${gender}
        AND (difficulty = ${fitnessLevel} OR difficulty IS NOT NULL)
      ORDER BY category, name
    `

    if (allExercises.length === 0) {
      return NextResponse.json({ 
        error: 'No exercises found for your profile. Please update your preferences.' 
      }, { status: 400 })
    }

    // Determine workout days
    const daysInWeek = 7
    const actualSkipDays = skipDays.filter((d: number) => d >= 0 && d < daysInWeek)
    const workoutDaysOfWeek = Array.from({ length: daysInWeek }, (_, i) => i).filter(
      (day) => !actualSkipDays.includes(day)
    )

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    // Create exercise context for AI
    const exerciseContext = JSON.stringify({
      totalExercises: allExercises.length,
      categories: [...new Set(allExercises.map((e: any) => e.category))],
      equipment: equipment || [],
      fitnessLevel,
      gender,
      exercises: allExercises.slice(0, 100).map((e: any) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        equipment: e.equipment,
        difficulty: e.difficulty,
        instructions: e.instructions,
        tips: e.tips
      }))
    })

    const workoutDaysContext = workoutDaysOfWeek
      .map(day => `${dayNames[day]}`)
      .join(', ')

    const prompt = `You are an expert fitness trainer. Create a detailed, personalized ${daysPerWeek}-day workout plan.

User Profile:
- Gender: ${gender}
- Fitness Level: ${fitnessLevel}
- Available Equipment: ${equipment?.join(', ') || 'Bodyweight'}
- Workout Days: ${workoutDaysContext}
- Goal: ${goal || 'General fitness'}

Available Exercises (sample):
${exerciseContext}

Create a structured workout plan that:
1. Varies exercises across different muscle groups
2. Includes proper warmup and cooldown for each day
3. Provides specific set/rep ranges based on fitness level
4. Includes detailed form instructions and safety tips
5. Specifies rest periods between sets
6. Focuses on progression and variety
7. Considers equipment availability

For each workout day, provide:
- Day focus (e.g., "Upper Body Strength")
- Warmup exercise with duration and form cues
- 4-6 exercises with sets, reps, rest periods, and detailed instructions
- Cooldown stretch with duration and benefits
- Specific notes about intensity and progression

Generate the complete workout plan as a structured JSON object.`

    const result = await generateText({
      model: 'openai/gpt-4o',
      system: `You are an expert fitness trainer creating personalized workout plans. Always return valid JSON matching the specified schema. Include exercise IDs from the available exercises list when possible. Make instructions detailed and safety-focused.`,
      prompt,
      output: Output.object({
        schema: WorkoutPlanSchema
      }),
      temperature: 0.7,
      maxOutputTokens: 4000
    })

    const workoutPlan = result.object

    // Save to database
    await sql`
      INSERT INTO workout_plans 
        (user_id, name, days_per_week, skip_days, plan_data, plan_status, created_at, updated_at)
      VALUES 
        (${userId}, ${name}, ${daysPerWeek}, ${JSON.stringify(skipDays)}, ${JSON.stringify(workoutPlan)}, 'active', NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        plan_data = ${JSON.stringify(workoutPlan)},
        updated_at = NOW()
    `

    return NextResponse.json({
      success: true,
      workoutPlan
    })
  } catch (error) {
    console.error('Error generating workout plan:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate workout plan' 
    }, { status: 500 })
  }
}

