import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active diet plan
    const dietPlan = await sql`
      SELECT * FROM diet_plans 
      WHERE user_id = ${user.id} AND is_active = true
      LIMIT 1
    `

    // Get today's log
    const todayLog = await sql`
      SELECT * FROM daily_logs 
      WHERE user_id = ${user.id} AND log_date = CURRENT_DATE
    `

    // Get profile for calorie calculations
    const profile = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${user.id}
    `

    return NextResponse.json({
      dietPlan: dietPlan[0] || null,
      todayLog: todayLog[0] || null,
      profile: profile[0] || null
    })

  } catch (error) {
    console.error('Diet error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch diet' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Log daily values
    await sql`
      INSERT INTO daily_logs (
        user_id, 
        log_date, 
        water_glasses,
        calories_consumed,
        protein_grams,
        carbs_grams,
        fat_grams,
        weight_kg,
        sleep_hours,
        mood,
        energy_level,
        notes
      )
      VALUES (
        ${user.id},
        CURRENT_DATE,
        ${data.water_glasses ?? null},
        ${data.calories_consumed ?? null},
        ${data.protein_grams ?? null},
        ${data.carbs_grams ?? null},
        ${data.fat_grams ?? null},
        ${data.weight_kg ?? null},
        ${data.sleep_hours ?? null},
        ${data.mood ?? null},
        ${data.energy_level ?? null},
        ${data.notes ?? null}
      )
      ON CONFLICT (user_id, log_date) 
      DO UPDATE SET
        water_glasses = COALESCE(EXCLUDED.water_glasses, daily_logs.water_glasses),
        calories_consumed = COALESCE(EXCLUDED.calories_consumed, daily_logs.calories_consumed),
        protein_grams = COALESCE(EXCLUDED.protein_grams, daily_logs.protein_grams),
        carbs_grams = COALESCE(EXCLUDED.carbs_grams, daily_logs.carbs_grams),
        fat_grams = COALESCE(EXCLUDED.fat_grams, daily_logs.fat_grams),
        weight_kg = COALESCE(EXCLUDED.weight_kg, daily_logs.weight_kg),
        sleep_hours = COALESCE(EXCLUDED.sleep_hours, daily_logs.sleep_hours),
        mood = COALESCE(EXCLUDED.mood, daily_logs.mood),
        energy_level = COALESCE(EXCLUDED.energy_level, daily_logs.energy_level),
        notes = COALESCE(EXCLUDED.notes, daily_logs.notes),
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Diet log error:', error)
    return NextResponse.json(
      { error: 'Failed to log diet' },
      { status: 500 }
    )
  }
}
