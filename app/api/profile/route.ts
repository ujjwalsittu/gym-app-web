import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await sql`
      SELECT 
        up.*,
        u.name,
        u.email
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.user_id = ${user.id}
    `

    const photos = await sql`
      SELECT * FROM body_photos 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    const workoutPlan = await sql`
      SELECT * FROM workout_plans 
      WHERE user_id = ${user.id} AND is_active = true
      LIMIT 1
    `

    const dietPlan = await sql`
      SELECT * FROM diet_plans 
      WHERE user_id = ${user.id} AND is_active = true
      LIMIT 1
    `

    return NextResponse.json({
      profile: profile[0] || null,
      photos,
      workoutPlan: workoutPlan[0] || null,
      dietPlan: dietPlan[0] || null
    })

  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    // Update user name if provided
    if (updates.name) {
      await sql`
        UPDATE users SET name = ${updates.name} WHERE id = ${user.id}
      `
    }

    // Update profile if provided
    if (updates.profile) {
      const p = updates.profile
      await sql`
        UPDATE user_profiles SET
          weight_kg = COALESCE(${p.weight_kg}, weight_kg),
          height_cm = COALESCE(${p.height_cm}, height_cm),
          target_weight_kg = COALESCE(${p.target_weight_kg}, target_weight_kg),
          fitness_goal = COALESCE(${p.fitness_goal}, fitness_goal),
          activity_level = COALESCE(${p.activity_level}, activity_level),
          updated_at = NOW()
        WHERE user_id = ${user.id}
      `
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
