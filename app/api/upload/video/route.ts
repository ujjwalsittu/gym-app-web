import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const video = formData.get('video') as File

    if (!video) {
      return NextResponse.json({ error: 'No video provided' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(
      `gym-verifications/${user.id}/${Date.now()}.webm`,
      video,
      { access: 'private' }
    )

    // Log the verification video
    await sql`
      UPDATE workout_sessions
      SET notes = CONCAT(COALESCE(notes, ''), ' | Gym verified via video')
      WHERE user_id = ${user.id}
        AND DATE(started_at) = CURRENT_DATE
        AND completed_at IS NULL
    `

    return NextResponse.json({ 
      success: true,
      pathname: blob.pathname
    })

  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
