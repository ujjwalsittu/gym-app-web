import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isUserAdmin } from '@/lib/admin'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get dashboard stats
    const stats = await Promise.all([
      // Total users
      sql`SELECT COUNT(*) as count FROM users`,
      // Total admins
      sql`SELECT COUNT(*) as count FROM users WHERE is_admin = true`,
      // Total exercises
      sql`SELECT COUNT(*) as count FROM exercise_library`,
      // Exercises with animations
      sql`SELECT COUNT(*) as count FROM exercise_library WHERE lottie_data IS NOT NULL`,
      // Total workouts
      sql`SELECT COUNT(*) as count FROM workout_sessions`,
      // Total body photos
      sql`SELECT COUNT(*) as count FROM body_photos`,
      // Recent users (last 7 days)
      sql`SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`,
      // Distinct users with workouts
      sql`SELECT COUNT(DISTINCT user_id) as count FROM workout_sessions`,
    ])

    return NextResponse.json({
      totalUsers: parseInt(stats[0][0].count) || 0,
      totalAdmins: parseInt(stats[1][0].count) || 0,
      totalExercises: parseInt(stats[2][0].count) || 0,
      exercisesWithAnimations: parseInt(stats[3][0].count) || 0,
      totalWorkouts: parseInt(stats[4][0].count) || 0,
      totalPhotos: parseInt(stats[5][0].count) || 0,
      recentUsersCount: parseInt(stats[6][0].count) || 0,
      activeUsers: parseInt(stats[7][0].count) || 0,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
