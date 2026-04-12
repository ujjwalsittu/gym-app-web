import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // warmup, cooldown, stretch, yoga

    let routines
    if (type) {
      routines = await sql`
        SELECT * FROM routines 
        WHERE type = ${type} AND (is_default = true OR created_by = ${user.id})
        ORDER BY is_default DESC, name ASC
      `
    } else {
      routines = await sql`
        SELECT * FROM routines 
        WHERE is_default = true OR created_by = ${user.id}
        ORDER BY type, is_default DESC, name ASC
      `
    }

    // Get user's saved/favorited routines
    const savedRoutines = await sql`
      SELECT routine_id FROM user_saved_routines 
      WHERE user_id = ${user.id}
    `
    const savedIds = new Set(savedRoutines.map((r: any) => r.routine_id))

    // Add saved flag to routines
    const routinesWithSaved = routines.map((r: any) => ({
      ...r,
      isSaved: savedIds.has(r.id)
    }))

    return NextResponse.json({ routines: routinesWithSaved })
  } catch (error) {
    console.error('Error fetching routines:', error)
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, routineId, ...routineData } = await request.json()

    // Save/unsave routine
    if (action === 'save') {
      await sql`
        INSERT INTO user_saved_routines (user_id, routine_id)
        VALUES (${user.id}, ${routineId})
        ON CONFLICT DO NOTHING
      `
      return NextResponse.json({ success: true })
    }

    if (action === 'unsave') {
      await sql`
        DELETE FROM user_saved_routines 
        WHERE user_id = ${user.id} AND routine_id = ${routineId}
      `
      return NextResponse.json({ success: true })
    }

    // Create new routine
    const { name, type, description, durationMinutes, exercises, targetAreas } = routineData

    const [routine] = await sql`
      INSERT INTO routines (
        name, type, description, duration_minutes, exercises, target_areas, created_by
      )
      VALUES (
        ${name}, 
        ${type}, 
        ${description}, 
        ${durationMinutes}, 
        ${JSON.stringify(exercises)}, 
        ${targetAreas || []},
        ${user.id}
      )
      RETURNING *
    `

    return NextResponse.json({ routine })
  } catch (error) {
    console.error('Error with routine action:', error)
    return NextResponse.json({ error: 'Failed to process routine action' }, { status: 500 })
  }
}
