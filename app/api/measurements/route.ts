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

    // Get measurements history
    const measurements = await sql`
      SELECT * FROM body_measurements 
      WHERE user_id = ${user.id}
      ORDER BY measured_at DESC
      LIMIT ${limit}
    `

    // Get latest measurement for each body part
    const latest = await sql`
      SELECT DISTINCT ON (measurement_type) *
      FROM body_measurements
      WHERE user_id = ${user.id}
      ORDER BY measurement_type, measured_at DESC
    `

    // Calculate changes (compare latest with 30 days ago)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const baseline = await sql`
      SELECT DISTINCT ON (measurement_type) *
      FROM body_measurements
      WHERE user_id = ${user.id} AND measured_at <= ${thirtyDaysAgo.toISOString()}
      ORDER BY measurement_type, measured_at DESC
    `

    // Create change map
    const changes: Record<string, number> = {}
    for (const l of latest) {
      const b = baseline.find((b: any) => b.measurement_type === l.measurement_type)
      if (b) {
        changes[l.measurement_type] = l.value - b.value
      }
    }

    return NextResponse.json({ 
      measurements, 
      latest,
      changes,
      hasBaseline: baseline.length > 0
    })
  } catch (error) {
    console.error('Error fetching measurements:', error)
    return NextResponse.json({ error: 'Failed to fetch measurements' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { measurements, notes } = await request.json()

    // Insert all measurements
    const inserted = []
    for (const [type, value] of Object.entries(measurements)) {
      if (value && typeof value === 'number' && value > 0) {
        const [measurement] = await sql`
          INSERT INTO body_measurements (user_id, measurement_type, value, unit, notes)
          VALUES (${user.id}, ${type}, ${value}, ${type === 'weight' ? 'kg' : 'cm'}, ${notes || null})
          RETURNING *
        `
        inserted.push(measurement)
      }
    }

    return NextResponse.json({ measurements: inserted })
  } catch (error) {
    console.error('Error saving measurements:', error)
    return NextResponse.json({ error: 'Failed to save measurements' }, { status: 500 })
  }
}
