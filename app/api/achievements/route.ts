import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/db'

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

    // Get all achievements with user unlock status
    const achievements = await sql`
      SELECT 
        a.*,
        ua.unlocked_at,
        CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as is_unlocked
      FROM achievements a
      LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ${userId}
      ORDER BY a.category, a.points DESC
    `

    // Get user stats for achievement progress
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM workout_sessions WHERE user_id = ${userId} AND completed_at IS NOT NULL) as total_workouts,
        (SELECT current_streak FROM user_streaks WHERE user_id = ${userId}) as current_streak,
        (SELECT longest_streak FROM user_streaks WHERE user_id = ${userId}) as longest_streak,
        (SELECT COUNT(*) FROM personal_records WHERE user_id = ${userId}) as total_prs,
        (SELECT SUM(calories_burned) FROM workout_sessions WHERE user_id = ${userId}) as total_calories
    `

    // Calculate total points
    const earnedPoints = achievements
      .filter((a: any) => a.is_unlocked)
      .reduce((sum: number, a: any) => sum + a.points, 0)

    const totalPoints = achievements.reduce((sum: number, a: any) => sum + a.points, 0)

    return NextResponse.json({
      achievements,
      stats: stats[0] || {},
      earnedPoints,
      totalPoints,
      unlockedCount: achievements.filter((a: any) => a.is_unlocked).length,
      totalCount: achievements.length
    })
  } catch (error) {
    console.error('Achievements fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
  }
}

// Check and award achievements
export async function POST() {
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
    const newAchievements: any[] = []

    // Get current stats
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM workout_sessions WHERE user_id = ${userId} AND completed_at IS NOT NULL) as total_workouts,
        (SELECT current_streak FROM user_streaks WHERE user_id = ${userId}) as current_streak,
        (SELECT longest_streak FROM user_streaks WHERE user_id = ${userId}) as longest_streak,
        (SELECT COUNT(*) FROM personal_records WHERE user_id = ${userId}) as total_prs
    `
    const s = stats[0] || {}

    // Check workout milestones
    const workoutMilestones = [
      { count: 1, code: 'first_workout' },
      { count: 7, code: 'week_warrior' },
      { count: 30, code: 'monthly_grinder' },
      { count: 100, code: 'centurion' }
    ]

    for (const m of workoutMilestones) {
      if (s.total_workouts >= m.count) {
        const awarded = await awardIfNotExists(userId, m.code)
        if (awarded) newAchievements.push(awarded)
      }
    }

    // Check streak milestones
    const streakMilestones = [
      { streak: 7, code: 'week_streak' },
      { streak: 30, code: 'month_streak' }
    ]

    for (const m of streakMilestones) {
      if ((s.current_streak || 0) >= m.streak || (s.longest_streak || 0) >= m.streak) {
        const awarded = await awardIfNotExists(userId, m.code)
        if (awarded) newAchievements.push(awarded)
      }
    }

    // Check PR milestones
    if (s.total_prs >= 1) {
      const awarded = await awardIfNotExists(userId, 'first_pr')
      if (awarded) newAchievements.push(awarded)
    }
    if (s.total_prs >= 10) {
      const awarded = await awardIfNotExists(userId, 'pr_collector')
      if (awarded) newAchievements.push(awarded)
    }

    return NextResponse.json({ newAchievements })
  } catch (error) {
    console.error('Achievement check error:', error)
    return NextResponse.json({ error: 'Failed to check achievements' }, { status: 500 })
  }
}

async function awardIfNotExists(userId: string, achievementCode: string) {
  try {
    const existing = await sql`
      SELECT ua.id FROM user_achievements ua
      JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = ${userId} AND a.code = ${achievementCode}
    `
    
    if (existing.length === 0) {
      const achievement = await sql`
        SELECT * FROM achievements WHERE code = ${achievementCode}
      `
      if (achievement.length > 0) {
        await sql`
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (${userId}, ${achievement[0].id})
        `
        return achievement[0]
      }
    }
    return null
  } catch (error) {
    console.error('Award achievement error:', error)
    return null
  }
}
