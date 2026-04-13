import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isUserAdmin } from '@/lib/admin'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get all users with their stats
    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.created_at,
        u.is_admin,
        COUNT(DISTINCT ws.id) as workout_count,
        COUNT(DISTINCT bp.id) as photo_count
      FROM users u
      LEFT JOIN workout_sessions ws ON u.id = ws.user_id
      LEFT JOIN body_photos bp ON u.id = bp.user_id
      GROUP BY u.id, u.email, u.created_at, u.is_admin
      ORDER BY u.created_at DESC
    `

    return NextResponse.json({
      users: users.map((user: any) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        is_admin: user.is_admin,
        workouts: parseInt(user.workout_count) || 0,
        photos: parseInt(user.photo_count) || 0
      }))
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'toggle_admin') {
      const user = await sql`
        SELECT is_admin FROM users WHERE id = ${userId}
      `

      if (user.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      await sql`
        UPDATE users SET is_admin = ${!user[0].is_admin} WHERE id = ${userId}
      `

      return NextResponse.json({
        success: true,
        message: `User ${!user[0].is_admin ? 'promoted to' : 'demoted from'} admin`
      })
    } else if (action === 'delete_user') {
      // Delete all user data
      await sql`
        DELETE FROM body_photos WHERE user_id = ${userId}
      `
      await sql`
        DELETE FROM workout_sessions WHERE user_id = ${userId}
      `
      await sql`
        DELETE FROM user_profiles WHERE user_id = ${userId}
      `
      await sql`
        DELETE FROM sessions WHERE user_id = ${userId}
      `
      await sql`
        DELETE FROM users WHERE id = ${userId}
      `

      return NextResponse.json({ success: true, message: 'User deleted' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing user:', error)
    return NextResponse.json({ error: 'Failed to manage user' }, { status: 500 })
  }
}
