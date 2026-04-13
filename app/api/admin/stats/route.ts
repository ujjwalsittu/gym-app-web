import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isUserAdmin } from '@/lib/admin'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get statistics
    const [usersCount, exercisesCount, workoutSessionsCount, bodyPhotosCount] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM exercise_library WHERE is_active = true`,
      sql`SELECT COUNT(*) as count FROM workout_sessions`,
      sql`SELECT COUNT(*) as count FROM body_photos`,
    ])

    // Get recent users
    const recentUsers = await sql`
      SELECT id, email, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `

    // Get active users this week
    const activeUsersWeek = await sql`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM workout_sessions 
      WHERE started_at >= NOW() - INTERVAL '7 days'
    `

    // Get total exercises by category
    const exercisesByCategory = await sql`
      SELECT category, COUNT(*) as count 
      FROM exercise_library 
      WHERE is_active = true
      GROUP BY category 
      ORDER BY count DESC
    `

    return NextResponse.json({
      stats: {
        totalUsers: usersCount[0]?.count || 0,
        totalExercises: exercisesCount[0]?.count || 0,
        totalWorkoutSessions: workoutSessionsCount[0]?.count || 0,
        totalBodyPhotos: bodyPhotosCount[0]?.count || 0,
        activeUsersThisWeek: activeUsersWeek[0]?.count || 0,
      },
      recentUsers,
      exercisesByCategory,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
