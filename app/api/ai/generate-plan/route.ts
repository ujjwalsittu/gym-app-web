import { generateText, Output } from 'ai'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const workoutPlanSchema = z.object({
  bodyAnalysis: z.object({
    bodyType: z.string(),
    estimatedBodyFat: z.string(),
    muscleGroups: z.object({
      strong: z.array(z.string()),
      needsWork: z.array(z.string())
    }),
    postureNotes: z.string(),
    recommendations: z.array(z.string())
  }),
  weeklyPlan: z.array(z.object({
    day: z.string(),
    name: z.string(),
    focus: z.string(),
    exercises: z.array(z.object({
      name: z.string(),
      sets: z.number(),
      reps: z.string(),
      restSeconds: z.number(),
      notes: z.string().nullable()
    })),
    durationMinutes: z.number(),
    caloriesBurn: z.number()
  })),
  dietPlan: z.object({
    dailyCalories: z.number(),
    macros: z.object({
      proteinGrams: z.number(),
      carbsGrams: z.number(),
      fatGrams: z.number()
    }),
    mealPlan: z.array(z.object({
      meal: z.string(),
      time: z.string(),
      foods: z.array(z.string()),
      calories: z.number(),
      protein: z.number()
    })),
    recommendations: z.array(z.string()),
    foodsToAvoid: z.array(z.string()),
    supplements: z.array(z.string())
  }),
  progressMilestones: z.array(z.object({
    week: z.number(),
    goal: z.string(),
    expectedProgress: z.string()
  })),
  tips: z.array(z.string())
})

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user profile
    const profileResult = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${userId}
    `
    if (profileResult.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    const profile = profileResult[0]

    // Get body photos
    const photosResult = await sql`
      SELECT * FROM body_photos 
      WHERE user_id = ${userId} 
      ORDER BY uploaded_at DESC 
      LIMIT 1
    `

    const photos = photosResult[0] || null

    // Build prompt with all user data
    const userContext = `
User Profile:
- Age: ${profile.age || 'Not specified'} years
- Gender: ${profile.gender || 'Not specified'}
- Height: ${profile.height_cm || 'Not specified'} cm
- Current Weight: ${profile.weight_kg || 'Not specified'} kg
- Target Weight: ${profile.target_weight_kg || 'Not specified'} kg
- Activity Level: ${profile.activity_level || 'moderate'}
- Sleep Hours: ${profile.sleep_hours || 7} hours/night

Diet Information:
- Diet Type: ${profile.diet_type || 'balanced'}
- Meals Per Day: ${profile.meals_per_day || 3}
- Water Intake: ${profile.water_intake_liters || 2} liters/day

Fitness Goals:
- Primary Goal: ${profile.fitness_goal || 'general_fitness'}
- Workout Days Per Week: ${profile.preferred_workout_days || 4}
- Workout Experience: ${profile.workout_experience || 'beginner'}

Medical Considerations:
- Medical Conditions: ${JSON.parse(profile.medical_conditions || '[]').join(', ') || 'None'}
- Injuries: ${JSON.parse(profile.injuries || '[]').join(', ') || 'None'}
- Food Allergies: ${JSON.parse(profile.food_allergies || '[]').join(', ') || 'None'}

Location: ${profile.city || ''}, ${profile.state || ''}, ${profile.country || ''}
`

    // Generate plan using AI with vision (if photos available)
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string | Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> }> = []

    const systemPrompt = `You are an expert fitness coach and nutritionist. Analyze the user's profile and body photos (if provided) to create a comprehensive, personalized workout and diet plan.

Consider:
1. User's current fitness level and body composition
2. Their primary goal and timeline
3. Available equipment and gym access
4. Medical conditions and injuries (modify exercises accordingly)
5. Dietary restrictions and allergies
6. Lifestyle factors (stress, sleep, work)

Create a safe, effective, and sustainable plan that progressively challenges the user while respecting their limitations.`

    let userContent: string | Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = `${userContext}\n\nPlease analyze my profile and create a comprehensive fitness and nutrition plan.`

    // If photos are available, include them in analysis
    if (photos && photos.blob_url) {
      userContent = [
        { type: 'text' as const, text: `${userContext}\n\nI've uploaded body photos for analysis. Please analyze my body composition, posture, and muscle development to create a targeted fitness and nutrition plan.` }
      ]
      
      // Note: In production, you'd fetch the actual images from blob storage
      // For now, we'll analyze based on the profile data
    }

    messages.push({ role: 'user', content: userContent })

    const { output } = await generateText({
      model: 'openai/gpt-4o',
      system: systemPrompt,
      output: Output.object({
        schema: workoutPlanSchema
      }),
      messages
    })

    if (!output) {
      throw new Error('Failed to generate plan')
    }

    // Save workout plan to database
    await sql`
      INSERT INTO workout_plans (user_id, name, plan_data, is_active)
      VALUES (
        ${userId},
        ${'AI Generated Plan - ' + new Date().toLocaleDateString()},
        ${JSON.stringify(output.weeklyPlan)},
        true
      )
      ON CONFLICT (user_id, is_active) WHERE is_active = true
      DO UPDATE SET
        name = EXCLUDED.name,
        plan_data = EXCLUDED.plan_data,
        updated_at = NOW()
    `

    // Save diet plan to database
    await sql`
      INSERT INTO diet_plans (user_id, name, plan_data, daily_calories, protein_grams, carbs_grams, fat_grams, is_active)
      VALUES (
        ${userId},
        ${'AI Generated Diet - ' + new Date().toLocaleDateString()},
        ${JSON.stringify(output.dietPlan)},
        ${output.dietPlan.dailyCalories},
        ${output.dietPlan.macros.proteinGrams},
        ${output.dietPlan.macros.carbsGrams},
        ${output.dietPlan.macros.fatGrams},
        true
      )
      ON CONFLICT (user_id, is_active) WHERE is_active = true
      DO UPDATE SET
        name = EXCLUDED.name,
        plan_data = EXCLUDED.plan_data,
        daily_calories = EXCLUDED.daily_calories,
        protein_grams = EXCLUDED.protein_grams,
        carbs_grams = EXCLUDED.carbs_grams,
        fat_grams = EXCLUDED.fat_grams,
        updated_at = NOW()
    `

    // Update body analysis in user profile
    await sql`
      UPDATE user_profiles
      SET 
        body_analysis = ${JSON.stringify(output.bodyAnalysis)},
        updated_at = NOW()
      WHERE user_id = ${userId}
    `

    return NextResponse.json({ 
      success: true, 
      plan: output 
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    )
  }
}
