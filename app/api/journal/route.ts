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
    const limit = parseInt(searchParams.get('limit') || '30')
    const offset = parseInt(searchParams.get('offset') || '0')

    const entries = await sql`
      SELECT 
        wj.*,
        ws.id as session_id,
        ws.completed_at as workout_completed_at
      FROM workout_journal wj
      LEFT JOIN workout_sessions ws ON wj.workout_session_id = ws.id
      WHERE wj.user_id = ${user.id}
      ORDER BY wj.entry_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get stats
    const [stats] = await sql`
      SELECT 
        COUNT(*) as total_entries,
        AVG(mood_rating) as avg_mood,
        AVG(energy_level) as avg_energy,
        AVG(sleep_quality) as avg_sleep
      FROM workout_journal
      WHERE user_id = ${user.id}
    `

    return NextResponse.json({ entries, stats })
  } catch (error) {
    console.error('Error fetching journal:', error)
    return NextResponse.json({ error: 'Failed to fetch journal' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      entryDate, 
      workoutSessionId, 
      content, 
      moodRating, 
      energyLevel, 
      sleepQuality, 
      sleepHours,
      tags 
    } = await request.json()

    const [entry] = await sql`
      INSERT INTO workout_journal (
        user_id, 
        entry_date, 
        workout_session_id, 
        content, 
        mood_rating, 
        energy_level, 
        sleep_quality, 
        sleep_hours,
        tags
      )
      VALUES (
        ${user.id}, 
        ${entryDate || new Date().toISOString().split('T')[0]}, 
        ${workoutSessionId || null}, 
        ${content}, 
        ${moodRating || null}, 
        ${energyLevel || null}, 
        ${sleepQuality || null}, 
        ${sleepHours || null},
        ${tags || []}
      )
      ON CONFLICT (user_id, entry_date) 
      DO UPDATE SET
        content = EXCLUDED.content,
        mood_rating = EXCLUDED.mood_rating,
        energy_level = EXCLUDED.energy_level,
        sleep_quality = EXCLUDED.sleep_quality,
        sleep_hours = EXCLUDED.sleep_hours,
        tags = EXCLUDED.tags,
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error saving journal entry:', error)
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
  }
}
