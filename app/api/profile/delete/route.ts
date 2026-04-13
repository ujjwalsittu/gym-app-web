import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { del, list } from '@vercel/blob'

export async function DELETE() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get all body photos for this user to delete from blob storage
    const photosResult = await sql`
      SELECT blob_url FROM body_photos WHERE user_id = ${userId}
    `

    // Delete photos from blob storage
    for (const photo of photosResult.rows) {
      if (photo.blob_url) {
        try {
          await del(photo.blob_url)
        } catch (error) {
          console.error('Error deleting blob:', error)
          // Continue with other deletions even if one fails
        }
      }
    }

    // Delete all user data in correct order (respecting foreign keys)
    await sql`DELETE FROM body_photos WHERE user_id = ${userId}`
    await sql`DELETE FROM workout_sessions WHERE user_id = ${userId}`
    await sql`DELETE FROM sessions WHERE user_id = ${userId}`
    await sql`DELETE FROM user_profiles WHERE user_id = ${userId}`
    await sql`DELETE FROM users WHERE id = ${userId}`

    return NextResponse.json({ success: true, message: 'Profile deleted successfully' })
  } catch (error) {
    console.error('Profile delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    )
  }
}
