import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { sql } from '@/lib/db'

// This endpoint should be called by a cron job to clean up verification videos
// Videos are deleted after verification is complete (success or failure)

export async function POST() {
  try {
    // Find all verification videos older than 24 hours
    const oldVideos = await sql`
      SELECT id, video_blob_pathname 
      FROM workout_sessions 
      WHERE video_blob_pathname IS NOT NULL 
        AND (gym_verified = true OR started_at < NOW() - INTERVAL '24 hours')
    `

    let deletedCount = 0

    for (const video of oldVideos) {
      try {
        // Delete from Vercel Blob
        if (video.video_blob_pathname) {
          await del(video.video_blob_pathname)
        }

        // Clear the pathname from database
        await sql`
          UPDATE workout_sessions 
          SET video_blob_pathname = NULL 
          WHERE id = ${video.id}
        `

        deletedCount++
      } catch (error) {
        console.error(`Failed to delete video ${video.id}:`, error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount,
      message: `Cleaned up ${deletedCount} verification videos` 
    })
  } catch (error) {
    console.error('Video cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}

// Immediate deletion after verification
export async function DELETE() {
  try {
    const { searchParams } = new URL(arguments[0].url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const sessions = await sql`
      SELECT video_blob_pathname FROM workout_sessions WHERE id = ${sessionId}
    `

    if (sessions.length > 0 && sessions[0].video_blob_pathname) {
      await del(sessions[0].video_blob_pathname)
      
      await sql`
        UPDATE workout_sessions 
        SET video_blob_pathname = NULL 
        WHERE id = ${sessionId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Video deletion error:', error)
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
