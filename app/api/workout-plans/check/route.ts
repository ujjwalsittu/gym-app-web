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

    // Get user profile to check onboarding and gender
    const userProfile = await sql`
      SELECT gender, goal, onboarding_completed FROM user_profiles WHERE user_id = ${userId}
    `

    if (!userProfile.length || !userProfile[0].onboarding_completed) {
      return NextResponse.json({
        hasWorkoutPlan: false,
        missingFields: ['Must complete onboarding']
      }, { status: 200 })
    }

    // Check required fields
    const missingFields = []
    if (!userProfile[0].gender) missingFields.push('gender')
    if (!userProfile[0].goal) missingFields.push('goal')

    if (missingFields.length > 0) {
      return NextResponse.json({
        hasWorkoutPlan: false,
        missingFields,
        message: 'Please fill in missing fields before generating workout plan'
      }, { status: 200 })
    }

    // Check if user has existing workout plan
    const existingPlan = await sql`
      SELECT id, name, days_per_week, created_at FROM workout_plans 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    return NextResponse.json({
      hasWorkoutPlan: existingPlan.length > 0,
      workoutPlan: existingPlan.length > 0 ? existingPlan[0] : null,
      userProfile: userProfile[0]
    })
  } catch (error) {
    console.error('Error checking workout plan:', error)
    return NextResponse.json({ error: 'Failed to check workout plan' }, { status: 500 })
  }
}
