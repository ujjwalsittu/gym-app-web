import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await sql`
      SELECT user_id FROM sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `
    
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const userId = sessions[0].user_id
    const { exerciseName, recordType, value, unit, sessionId } = await request.json()

    // Check if this beats existing PR
    const existingPR = await sql`
      SELECT * FROM personal_records 
      WHERE user_id = ${userId} 
        AND exercise_name = ${exerciseName} 
        AND record_type = ${recordType}
    `

    let isNewPR = false
    let prId

    if (existingPR.length === 0) {
      // First time recording this exercise
      const result = await sql`
        INSERT INTO personal_records (user_id, exercise_name, record_type, value, unit, session_id)
        VALUES (${userId}, ${exerciseName}, ${recordType}, ${value}, ${unit}, ${sessionId})
        RETURNING id
      `
      prId = result[0].id
      isNewPR = true
    } else if (value > existingPR[0].value) {
      // New personal record!
      await sql`
        UPDATE personal_records 
        SET previous_value = value,
            value = ${value},
            session_id = ${sessionId},
            achieved_at = NOW()
        WHERE id = ${existingPR[0].id}
      `
      prId = existingPR[0].id
      isNewPR = true
    }

    // If new PR, check for achievements
    if (isNewPR) {
      // Count total PRs for achievement
      const prCount = await sql`
        SELECT COUNT(*) as count FROM personal_records WHERE user_id = ${userId}
      `
      
      // Award PR-related achievements
      if (prCount[0].count >= 1) {
        await awardAchievement(userId, 'first_pr')
      }
      if (prCount[0].count >= 10) {
        await awardAchievement(userId, 'pr_collector')
      }
    }

    return NextResponse.json({ 
      isNewPR, 
      prId,
      previousValue: existingPR[0]?.value || null
    })
  } catch (error) {
    console.error('PR save error:', error)
    return NextResponse.json({ error: 'Failed to save PR' }, { status: 500 })
  }
}

async function awardAchievement(userId: string, achievementCode: string) {
  try {
    // Check if already has achievement
    const existing = await sql`
      SELECT ua.id FROM user_achievements ua
      JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = ${userId} AND a.code = ${achievementCode}
    `
    
    if (existing.length === 0) {
      await sql`
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT ${userId}, id FROM achievements WHERE code = ${achievementCode}
      `
    }
  } catch (error) {
    console.error('Award achievement error:', error)
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await sql`
      SELECT user_id FROM sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `
    
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const userId = sessions[0].user_id

    const prs = await sql`
      SELECT * FROM personal_records 
      WHERE user_id = ${userId}
      ORDER BY achieved_at DESC
    `

    return NextResponse.json({ personalRecords: prs })
  } catch (error) {
    console.error('PR fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch PRs' }, { status: 500 })
  }
}
