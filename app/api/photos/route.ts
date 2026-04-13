import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vfit_session')?.value
    
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

    // Get all photos grouped by date
    const photos = await sql`
      SELECT 
        id,
        photo_type,
        blob_url,
        uploaded_at,
        uploaded_at as created_at
      FROM body_photos
      WHERE user_id = ${userId}
      ORDER BY uploaded_at DESC
    `

    // Group photos by date for comparison
    const groupedPhotos: Record<string, any[]> = {}
    photos.forEach((photo: any) => {
      const dateKey = new Date(photo.uploaded_at || photo.created_at).toISOString().split('T')[0]
      if (!groupedPhotos[dateKey]) {
        groupedPhotos[dateKey] = []
      }
      groupedPhotos[dateKey].push(photo)
    })

    // Convert to array format
    const photoSets = Object.entries(groupedPhotos).map(([date, photos]) => ({
      date,
      photos
    }))

    return NextResponse.json({ photoSets })
  } catch (error) {
    console.error('Photos fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}
