import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Get all active challenges
    const challenges = await sql`
      SELECT 
        c.*,
        uc.joined_at,
        uc.progress,
        uc.completed,
        uc.completed_at
      FROM challenges c
      LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = ${user.id}
      WHERE c.end_date >= ${now.toISOString()} OR uc.user_id IS NOT NULL
      ORDER BY c.start_date DESC
    `

    // Categorize challenges
    const active = challenges.filter((c: { start_date: string, end_date: string }) => 
      new Date(c.start_date) <= now && new Date(c.end_date) >= now
    )
    const upcoming = challenges.filter((c: { start_date: string }) => 
      new Date(c.start_date) > now
    )
    const completed = challenges.filter((c: { completed: boolean }) => c.completed)

    return NextResponse.json({
      challenges: {
        active,
        upcoming,
        completed
      }
    })
  } catch (error) {
    console.error('Challenges fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { challengeId } = await request.json()

    // Check if already joined
    const existing = await sql`
      SELECT id FROM user_challenges
      WHERE user_id = ${user.id} AND challenge_id = ${challengeId}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already joined' }, { status: 400 })
    }

    // Join challenge
    await sql`
      INSERT INTO user_challenges (user_id, challenge_id, progress, completed)
      VALUES (${user.id}, ${challengeId}, 0, false)
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Join challenge error:', error)
    return NextResponse.json({ error: 'Failed to join challenge' }, { status: 500 })
  }
}
