import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    // Get workout plan
    const plan = await sql`
      SELECT id, name, description, days_per_week, skip_days, created_at, updated_at
      FROM workout_plans
      WHERE id = ${planId} AND user_id = ${userId}
    `

    if (!plan.length) {
      return NextResponse.json({ error: 'Workout plan not found' }, { status: 404 })
    }

    // Get workout days with exercises
    const workoutDays = await sql`
      SELECT wpd.id, wpd.day_of_week, wpd.created_at,
        json_agg(
          json_build_object(
            'exercise_id', el.id,
            'name', el.name,
            'category', el.category,
            'equipment', el.equipment,
            'lottie_data', el.lottie_data
          )
        ) as exercises
      FROM workout_plan_days wpd
      LEFT JOIN workout_plan_exercises wpe ON wpe.day_id = wpd.id
      LEFT JOIN exercise_library el ON el.id = wpe.exercise_id
      WHERE wpd.plan_id = ${planId}
      GROUP BY wpd.id, wpd.day_of_week, wpd.created_at
      ORDER BY wpd.day_of_week
    `

    return NextResponse.json({
      plan: plan[0],
      days: workoutDays
    })
  } catch (error) {
    console.error('Error fetching workout plan:', error)
    return NextResponse.json({ error: 'Failed to fetch workout plan' }, { status: 500 })
  }
}
