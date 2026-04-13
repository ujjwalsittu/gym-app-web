import { list, del } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // List all blobs in the users/ folder (old user photos)
    const { blobs } = await list({ prefix: 'users/' })

    return NextResponse.json({
      count: blobs.length,
      blobs: blobs.map(b => ({
        pathname: b.pathname,
        url: b.url,
        size: b.size,
        uploadedAt: b.uploadedAt
      }))
    })
  } catch (error) {
    console.error('Error listing blobs:', error)
    return NextResponse.json({ error: 'Failed to list blobs' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // List all blobs in users/ folder (old photos) - but NOT the exercises folder
    const { blobs } = await list({ prefix: 'users/' })
    
    // Filter out the Archive.zip which contains lottie files
    const photosToDelete = blobs.filter(b => 
      !b.pathname.includes('Archive.zip') && 
      !b.pathname.includes('exercises/') &&
      (b.pathname.includes('.jpg') || 
       b.pathname.includes('.jpeg') || 
       b.pathname.includes('.png') || 
       b.pathname.includes('.webp'))
    )

    let deleted = 0
    for (const blob of photosToDelete) {
      try {
        await del(blob.url)
        deleted++
      } catch (err) {
        console.error(`Failed to delete ${blob.pathname}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
      total: photosToDelete.length
    })
  } catch (error) {
    console.error('Error deleting blobs:', error)
    return NextResponse.json({ error: 'Failed to delete blobs' }, { status: 500 })
  }
}
