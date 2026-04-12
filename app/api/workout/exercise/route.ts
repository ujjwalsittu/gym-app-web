import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Log a completed set
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, exerciseName, setNumber, repsCompleted, weightUsed, durationSeconds, notes } = await request.json()

    const result = await sql`
      INSERT INTO exercise_logs (session_id, exercise_name, set_number, reps_completed, weight_used, duration_seconds, notes)
      VALUES (${sessionId}, ${exerciseName}, ${setNumber}, ${repsCompleted}, ${weightUsed || null}, ${durationSeconds || null}, ${notes || null})
      RETURNING *
    `

    return NextResponse.json({ log: result[0] })
  } catch (error) {
    console.error('Exercise log error:', error)
    return NextResponse.json({ error: 'Failed to log exercise' }, { status: 500 })
  }
}

// Mark exercise as complete
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { logId, completed } = await request.json()

    const result = await sql`
      UPDATE exercise_logs 
      SET completed = ${completed}
      WHERE id = ${logId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    return NextResponse.json({ log: result[0] })
  } catch (error) {
    console.error('Exercise update error:', error)
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
  }
}
