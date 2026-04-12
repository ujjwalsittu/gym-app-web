import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
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
    const profile = profileResult[0] || null

    // Get active workout plan
    const workoutPlanResult = await sql`
      SELECT * FROM workout_plans 
      WHERE user_id = ${userId} AND is_active = true
      LIMIT 1
    `
    const workoutPlan = workoutPlanResult[0] || null

    // Get active diet plan
    const dietPlanResult = await sql`
      SELECT * FROM diet_plans 
      WHERE user_id = ${userId} AND is_active = true
      LIMIT 1
    `
    const dietPlan = dietPlanResult[0] || null

    // Get today's workout session (if any)
    const today = new Date().toISOString().split('T')[0]
    const todaySessionResult = await sql`
      SELECT * FROM workout_sessions 
      WHERE user_id = ${userId} 
      AND DATE(started_at) = ${today}
      ORDER BY started_at DESC
      LIMIT 1
    `
    const todaySession = todaySessionResult[0] || null

    // Get exercise logs for today's session
    let todayExercises: unknown[] = []
    if (todaySession) {
      todayExercises = await sql`
        SELECT * FROM exercise_logs 
        WHERE session_id = ${todaySession.id}
        ORDER BY created_at ASC
      `
    }

    // Get weekly stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const weeklyStatsResult = await sql`
      SELECT 
        COUNT(DISTINCT DATE(started_at)) as workout_days,
        SUM(EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - started_at))/60) as total_minutes,
        SUM(calories_burned) as total_calories
      FROM workout_sessions 
      WHERE user_id = ${userId} 
      AND started_at >= ${weekAgo}
    `
    const weeklyStats = weeklyStatsResult[0] || { workout_days: 0, total_minutes: 0, total_calories: 0 }

    // Get body analysis
    const bodyAnalysis = profile?.body_analysis ? JSON.parse(profile.body_analysis) : null

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      },
      profile: profile ? {
        age: profile.age,
        weight: profile.weight_kg,
        height: profile.height_cm,
        targetWeight: profile.target_weight_kg,
        primaryGoal: profile.primary_goal,
        workoutDaysPerWeek: profile.workout_days_per_week,
        gymAccess: profile.gym_access,
        bodyAnalysis
      } : null,
      workoutPlan: workoutPlan ? {
        id: workoutPlan.id,
        name: workoutPlan.name,
        plan: JSON.parse(workoutPlan.plan_data || '[]')
      } : null,
      dietPlan: dietPlan ? {
        id: dietPlan.id,
        name: dietPlan.name,
        dailyCalories: dietPlan.daily_calories,
        protein: dietPlan.protein_grams,
        carbs: dietPlan.carbs_grams,
        fat: dietPlan.fat_grams,
        plan: JSON.parse(dietPlan.plan_data || '{}')
      } : null,
      todaySession,
      todayExercises,
      weeklyStats: {
        workoutDays: parseInt(String(weeklyStats.workout_days)) || 0,
        totalMinutes: Math.round(parseFloat(String(weeklyStats.total_minutes)) || 0),
        totalCalories: parseInt(String(weeklyStats.total_calories)) || 0
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    )
  }
}
