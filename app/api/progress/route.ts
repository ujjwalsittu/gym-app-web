import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const range = url.searchParams.get('range') || '30' // days

    // Get weight progress
    const weightData = await sql`
      SELECT 
        log_date,
        weight_kg
      FROM daily_logs
      WHERE user_id = ${user.id}
        AND weight_kg IS NOT NULL
        AND log_date >= CURRENT_DATE - INTERVAL '${parseInt(range)} days'
      ORDER BY log_date ASC
    `

    // Get workout consistency
    const workoutData = await sql`
      SELECT 
        DATE(started_at) as workout_date,
        COUNT(*) as workouts,
        SUM(EXTRACT(EPOCH FROM (completed_at - started_at))/60)::int as total_minutes,
        SUM(calories_burned) as total_calories
      FROM workout_sessions
      WHERE user_id = ${user.id}
        AND completed_at IS NOT NULL
        AND started_at >= CURRENT_DATE - INTERVAL '${parseInt(range)} days'
      GROUP BY DATE(started_at)
      ORDER BY workout_date ASC
    `

    // Get exercise volume (total sets/reps per muscle group)
    const volumeData = await sql`
      SELECT 
        DATE(el.logged_at) as log_date,
        SUM(el.reps_completed * COALESCE(el.weight_used, 1)) as total_volume
      FROM exercise_logs el
      JOIN workout_sessions ws ON el.session_id = ws.id
      WHERE ws.user_id = ${user.id}
        AND el.logged_at >= CURRENT_DATE - INTERVAL '${parseInt(range)} days'
      GROUP BY DATE(el.logged_at)
      ORDER BY log_date ASC
    `

    // Get daily water intake
    const waterData = await sql`
      SELECT 
        log_date,
        water_glasses
      FROM daily_logs
      WHERE user_id = ${user.id}
        AND water_glasses IS NOT NULL
        AND log_date >= CURRENT_DATE - INTERVAL '${parseInt(range)} days'
      ORDER BY log_date ASC
    `

    // Get streak data
    const streakData = await sql`
      WITH daily_status AS (
        SELECT DISTINCT DATE(started_at) as workout_date
        FROM workout_sessions
        WHERE user_id = ${user.id}
          AND completed_at IS NOT NULL
        ORDER BY workout_date DESC
      ),
      streak_calc AS (
        SELECT 
          workout_date,
          workout_date - (ROW_NUMBER() OVER (ORDER BY workout_date DESC))::int as streak_group
        FROM daily_status
      )
      SELECT COUNT(*) as current_streak
      FROM streak_calc
      WHERE streak_group = (
        SELECT streak_group FROM streak_calc WHERE workout_date = CURRENT_DATE - 1
        UNION
        SELECT streak_group FROM streak_calc WHERE workout_date = CURRENT_DATE
        LIMIT 1
      )
    `

    // Get total stats
    const totalStats = await sql`
      SELECT 
        COUNT(*) as total_workouts,
        SUM(EXTRACT(EPOCH FROM (completed_at - started_at))/60)::int as total_minutes,
        SUM(calories_burned) as total_calories
      FROM workout_sessions
      WHERE user_id = ${user.id}
        AND completed_at IS NOT NULL
    `

    // Get profile for starting weight
    const profile = await sql`
      SELECT weight_kg, target_weight_kg
      FROM user_profiles
      WHERE user_id = ${user.id}
    `

    return NextResponse.json({
      weight: weightData.map(d => ({
        date: d.log_date,
        weight: parseFloat(d.weight_kg)
      })),
      workouts: workoutData.map(d => ({
        date: d.workout_date,
        workouts: parseInt(d.workouts),
        minutes: d.total_minutes || 0,
        calories: d.total_calories || 0
      })),
      volume: volumeData.map(d => ({
        date: d.log_date,
        volume: parseInt(d.total_volume) || 0
      })),
      water: waterData.map(d => ({
        date: d.log_date,
        glasses: parseInt(d.water_glasses) || 0
      })),
      currentStreak: parseInt(streakData[0]?.current_streak) || 0,
      totalStats: {
        workouts: parseInt(totalStats[0]?.total_workouts) || 0,
        minutes: totalStats[0]?.total_minutes || 0,
        calories: totalStats[0]?.total_calories || 0
      },
      startWeight: profile[0]?.weight_kg ? parseFloat(profile[0].weight_kg) : null,
      targetWeight: profile[0]?.target_weight_kg ? parseFloat(profile[0].target_weight_kg) : null
    })

  } catch (error) {
    console.error('Progress error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}
