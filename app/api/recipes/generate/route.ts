import { generateText, Output } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/db'
import { z } from 'zod'

const recipeSchema = z.object({
  name: z.string(),
  description: z.string(),
  prepTime: z.number(),
  cookTime: z.number(),
  servings: z.number(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  ingredients: z.array(z.object({
    item: z.string(),
    amount: z.string(),
    unit: z.string()
  })),
  instructions: z.array(z.string()),
  tips: z.array(z.string()).nullable(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'])
})

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vfit_session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await sql`
      SELECT user_id FROM sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `
    
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const userId = sessions[0].user_id

    // Get user profile for dietary preferences
    const profiles = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${userId}
    `
    const profile = profiles[0] || {}

    // Get diet plan for macro targets
    const diets = await sql`
      SELECT * FROM diet_plans WHERE user_id = ${userId} AND is_active = true
    `
    const diet = diets[0]

    const { mealType, preferences } = await request.json()

    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({ schema: recipeSchema }),
      prompt: `Generate a healthy ${mealType} recipe for someone with the following profile:

Diet Type: ${profile.diet_type || 'balanced'}
Allergies: ${profile.allergies || 'none'}
Target Daily Calories: ${diet?.daily_calories || 2000}
Target Protein: ${diet?.protein_grams || 150}g
Target Carbs: ${diet?.carbs_grams || 200}g
Target Fat: ${diet?.fat_grams || 65}g
${preferences ? `Preferences: ${preferences}` : ''}

Create a delicious, easy-to-make recipe that fits their dietary needs. Include accurate nutritional information.`
    })

    const recipe = result.object

    // Save recipe to database
    const saved = await sql`
      INSERT INTO recipes (
        user_id, name, description, meal_type, prep_time, cook_time,
        servings, calories, protein, carbs, fat, ingredients, instructions, tips
      ) VALUES (
        ${userId}, ${recipe.name}, ${recipe.description}, ${recipe.mealType},
        ${recipe.prepTime}, ${recipe.cookTime}, ${recipe.servings},
        ${recipe.calories}, ${recipe.protein}, ${recipe.carbs}, ${recipe.fat},
        ${JSON.stringify(recipe.ingredients)}, ${JSON.stringify(recipe.instructions)},
        ${JSON.stringify(recipe.tips || [])}
      ) RETURNING id
    `

    return NextResponse.json({ recipe: { ...recipe, id: saved[0].id } })
  } catch (error) {
    console.error('Recipe generation error:', error)
    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 })
  }
}
