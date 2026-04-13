import { type NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { sql } from '@neon_http/database'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await (await import('next/headers')).cookies()
    const sessionToken = cookieStore.get('vfit_session')?.value

    if (!sessionToken) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Verify session
    const sessions = await sql`
      SELECT user_id FROM sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `

    if (sessions.length === 0) {
      return new NextResponse('Session expired', { status: 401 })
    }

    const userId = sessions[0].user_id
    const pathname = request.nextUrl.searchParams.get('pathname')
    const photoId = request.nextUrl.searchParams.get('photoId')

    if (!pathname && !photoId) {
      return NextResponse.json({ error: 'Missing pathname or photoId' }, { status: 400 })
    }

    let photoPathname = pathname

    // If photoId provided, fetch from database
    if (photoId && !pathname) {
      const photos = await sql`
        SELECT blob_url FROM body_photos 
        WHERE id = ${photoId} AND user_id = ${userId}
      `

      if (photos.length === 0) {
        return new NextResponse('Photo not found', { status: 404 })
      }

      // Extract pathname from blob URL if needed
      photoPathname = photos[0].blob_url.includes('/') 
        ? photos[0].blob_url.split('/').pop() 
        : photos[0].blob_url
    }

    // Verify photo belongs to user
    const userPhotos = await sql`
      SELECT * FROM body_photos 
      WHERE user_id = ${userId} AND blob_url LIKE ${'%' + photoPathname + '%'}
    `

    if (userPhotos.length === 0) {
      return new NextResponse('Unauthorized to view this photo', { status: 403 })
    }

    // Get blob and stream it
    const result = await get(photoPathname, {
      access: 'private',
      ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
    })

    if (!result) {
      return new NextResponse('Not found', { status: 404 })
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          'Cache-Control': 'private, no-cache',
        },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        ETag: result.blob.etag,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    console.error('Error serving photo:', error)
    return NextResponse.json({ error: 'Failed to serve photo' }, { status: 500 })
  }
}
