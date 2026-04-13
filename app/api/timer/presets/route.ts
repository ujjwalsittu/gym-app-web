import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get system presets and user's custom presets
    const presets = await sql`
      SELECT * FROM timer_presets 
      WHERE user_id IS NULL OR user_id = ${user.id}
      ORDER BY is_system DESC, name ASC
    `

    return NextResponse.json({ presets })
  } catch (error) {
    console.error('Error fetching timer presets:', error)
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, type, workSeconds, restSeconds, rounds, prepSeconds } = await request.json()

    const [preset] = await sql`
      INSERT INTO timer_presets (user_id, name, timer_type, config)
      VALUES (${user.id}, ${name}, ${type}, ${JSON.stringify({ workSeconds, restSeconds, rounds, prepSeconds: prepSeconds || 10 })})
      RETURNING *
    `

    return NextResponse.json({ preset })
  } catch (error) {
    console.error('Error creating timer preset:', error)
    return NextResponse.json({ error: 'Failed to create preset' }, { status: 500 })
  }
}
