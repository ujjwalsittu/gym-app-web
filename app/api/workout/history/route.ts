import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vfit_session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from session
    const sessions = await sql`
      SELECT user_id FROM sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `
    
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const userId = sessions[0].user_id

    // Get workout history with exercise details
    const workouts = await sql`
      SELECT 
        ws.id,
        ws.day_of_week,
        ws.started_at,
        ws.completed_at,
        ws.status,
        ws.notes,
        EXTRACT(EPOCH FROM (COALESCE(ws.completed_at, NOW()) - ws.started_at))/60 as duration_minutes,
        COUNT(el.id) as exercise_count,
        COALESCE(SUM(el.actual_weight_kg * el.actual_reps), 0) as total_volume
      FROM workout_sessions ws
      LEFT JOIN exercise_logs el ON el.session_id = ws.id
      WHERE ws.user_id = ${userId}
      GROUP BY ws.id
      ORDER BY ws.started_at DESC
      LIMIT 50
    `

    // Get personal records
    const prs = await sql`
      SELECT 
        pr.*,
        pr.achieved_at
      FROM personal_records pr
      WHERE pr.user_id = ${userId}
      ORDER BY pr.achieved_at DESC
    `

    // Get streak info
    const streaks = await sql`
      SELECT * FROM user_streaks WHERE user_id = ${userId}
    `

    // Calculate stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total_workouts,
        SUM(EXTRACT(EPOCH FROM (COALESCE(ws.completed_at, NOW()) - ws.started_at))/60) as total_minutes,
        AVG(EXTRACT(EPOCH FROM (COALESCE(ws.completed_at, NOW()) - ws.started_at))/60) as avg_duration
      FROM workout_sessions ws
      WHERE ws.user_id = ${userId} AND ws.completed_at IS NOT NULL
    `

    return NextResponse.json({
      workouts,
      personalRecords: prs,
      streak: streaks[0] || { current_streak: 0, longest_streak: 0 },
      stats: {
        total_workouts: stats[0]?.total_workouts || 0,
        total_minutes: Math.round(stats[0]?.total_minutes || 0),
        total_calories: 0, // Not tracked in DB
        avg_duration: Math.round(stats[0]?.avg_duration || 0)
      }
    })
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
