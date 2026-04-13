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
    const type = searchParams.get('type') || 'streak' // streak, workouts, volume, calories
    const period = searchParams.get('period') || 'weekly' // weekly, monthly, alltime
    const challengeId = searchParams.get('challengeId')

    let leaderboard
    let userRank

    if (challengeId) {
      // Challenge-specific leaderboard
      leaderboard = await sql`
        SELECT 
          u.id,
          p.full_name as name,
          u.email,
          uc.progress as score,
          uc.completed,
          RANK() OVER (ORDER BY uc.progress DESC) as rank
        FROM user_challenges uc
        JOIN users u ON uc.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE uc.challenge_id = ${challengeId}
        ORDER BY uc.progress DESC
        LIMIT 50
      `

      const userRankResult = await sql`
        SELECT rank FROM (
          SELECT 
            user_id,
            RANK() OVER (ORDER BY progress DESC) as rank
          FROM user_challenges
          WHERE challenge_id = ${challengeId}
        ) ranked
        WHERE user_id = ${user.id}
      `
      userRank = userRankResult[0]?.rank
    } else {
      // Get date range based on period
      let startDate: Date
      const now = new Date()
      
      switch (period) {
        case 'weekly':
          startDate = new Date(now.setDate(now.getDate() - 7))
          break
        case 'monthly':
          startDate = new Date(now.setMonth(now.getMonth() - 1))
          break
        default:
          startDate = new Date(0) // All time
      }

      switch (type) {
        case 'streak':
          leaderboard = await sql`
            SELECT 
              u.id,
              p.full_name as name,
              u.email,
              COALESCE(us.current_streak, 0) as score,
              RANK() OVER (ORDER BY COALESCE(us.current_streak, 0) DESC) as rank
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN user_streaks us ON u.id = us.user_id
            ORDER BY score DESC
            LIMIT 50
          `
          break

        case 'workouts':
          leaderboard = await sql`
            SELECT 
              u.id,
              p.full_name as name,
              u.email,
              COUNT(ws.id) as score,
              RANK() OVER (ORDER BY COUNT(ws.id) DESC) as rank
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN workout_sessions ws ON u.id = ws.user_id 
              AND ws.status = 'completed'
              AND ws.started_at >= ${startDate.toISOString()}
            GROUP BY u.id, p.full_name, u.email
            ORDER BY score DESC
            LIMIT 50
          `
          break

        case 'calories':
          leaderboard = await sql`
            SELECT 
              u.id,
              p.full_name as name,
              u.email,
              COALESCE(SUM(el.actual_weight_kg * el.actual_reps / 10), 0)::int as score,
              RANK() OVER (ORDER BY COALESCE(SUM(el.actual_weight_kg * el.actual_reps / 10), 0) DESC) as rank
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN workout_sessions ws ON u.id = ws.user_id 
              AND ws.status = 'completed'
              AND ws.started_at >= ${startDate.toISOString()}
            LEFT JOIN exercise_logs el ON ws.id = el.session_id
            GROUP BY u.id, p.full_name, u.email
            ORDER BY score DESC
            LIMIT 50
          `
          break

        case 'volume':
          leaderboard = await sql`
            SELECT 
              u.id,
              p.full_name as name,
              u.email,
              COALESCE(SUM(el.actual_weight_kg * el.actual_reps), 0)::int as score,
              RANK() OVER (ORDER BY COALESCE(SUM(el.actual_weight_kg * el.actual_reps), 0) DESC) as rank
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN workout_sessions ws ON u.id = ws.user_id 
              AND ws.status = 'completed'
              AND ws.started_at >= ${startDate.toISOString()}
            LEFT JOIN exercise_logs el ON ws.id = el.session_id
            GROUP BY u.id, p.full_name, u.email
            ORDER BY score DESC
            LIMIT 50
          `
          break

        default:
          leaderboard = []
      }

      // Get user's rank
      const userEntry = leaderboard.find((e: { id: string }) => e.id === user.id)
      userRank = userEntry?.rank
    }

    return NextResponse.json({
      leaderboard,
      userRank,
      userId: user.id
    })
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
