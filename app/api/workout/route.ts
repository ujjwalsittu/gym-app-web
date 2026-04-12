import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Start a new workout session
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, workoutDay } = await request.json()
    const userId = session.user.id

    // Create workout session
    const result = await sql`
      INSERT INTO workout_sessions (user_id, plan_id, workout_day)
      VALUES (${userId}, ${planId || null}, ${workoutDay || null})
      RETURNING *
    `

    return NextResponse.json({ session: result[0] })
  } catch (error) {
    console.error('Workout start error:', error)
    return NextResponse.json({ error: 'Failed to start workout' }, { status: 500 })
  }
}

// Get active workout session
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]

    // Get today's session
    const sessionResult = await sql`
      SELECT * FROM workout_sessions 
      WHERE user_id = ${userId}
      AND DATE(started_at) = ${today}
      AND completed_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `

    if (sessionResult.length === 0) {
      return NextResponse.json({ session: null, exercises: [] })
    }

    const workoutSession = sessionResult[0]

    // Get exercise logs for this session
    const exerciseLogs = await sql`
      SELECT * FROM exercise_logs 
      WHERE session_id = ${workoutSession.id}
      ORDER BY created_at ASC
    `

    return NextResponse.json({ 
      session: workoutSession, 
      exercises: exerciseLogs 
    })
  } catch (error) {
    console.error('Workout get error:', error)
    return NextResponse.json({ error: 'Failed to get workout' }, { status: 500 })
  }
}

// Complete workout session
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, caloriesBurned } = await request.json()
    const userId = session.user.id

    const result = await sql`
      UPDATE workout_sessions 
      SET completed_at = NOW(), calories_burned = ${caloriesBurned || 0}
      WHERE id = ${sessionId} AND user_id = ${userId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ session: result[0] })
  } catch (error) {
    console.error('Workout complete error:', error)
    return NextResponse.json({ error: 'Failed to complete workout' }, { status: 500 })
  }
}
