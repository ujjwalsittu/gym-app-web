import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Log a completed set
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workoutId, exerciseId, sets, reps, weight, duration, notes } = await request.json()

    if (!workoutId || !exerciseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO workout_exercises 
        (workout_session_id, exercise_id, sets_completed, reps_completed, weight_lifted, duration_seconds, notes, created_at)
      VALUES 
        (${workoutId}, ${exerciseId}, ${sets || 0}, ${reps || 0}, ${weight || 0}, ${duration || 0}, ${notes || ''}, NOW())
      RETURNING id, exercise_id, sets_completed, reps_completed, weight_lifted
    `

    return NextResponse.json({ success: true, exercise: result[0] })
  } catch (error) {
    console.error('Exercise log error:', error)
    return NextResponse.json({ error: 'Failed to log exercise' }, { status: 500 })
  }
}

// Get exercises for a workout session
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workoutId = searchParams.get('workoutId')

    if (!workoutId) {
      return NextResponse.json({ error: 'workoutId required' }, { status: 400 })
    }

    const exercises = await sql`
      SELECT 
        we.id,
        we.exercise_id,
        el.name,
        we.sets_completed,
        we.reps_completed,
        we.weight_lifted,
        we.duration_seconds,
        we.notes,
        we.created_at
      FROM workout_exercises we
      JOIN exercise_library el ON we.exercise_id = el.id
      WHERE we.workout_session_id = ${workoutId}
      ORDER BY we.created_at ASC
    `

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error('Exercise fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
  }
}

// Update exercise log
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, sets, reps, weight, duration, notes } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Exercise ID required' }, { status: 400 })
    }

    const result = await sql`
      UPDATE workout_exercises 
      SET 
        sets_completed = ${sets || 0},
        reps_completed = ${reps || 0},
        weight_lifted = ${weight || 0},
        duration_seconds = ${duration || 0},
        notes = ${notes || ''}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, exercise: result[0] })
  } catch (error) {
    console.error('Exercise update error:', error)
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
  }
}
