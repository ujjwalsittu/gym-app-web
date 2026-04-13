import { type NextRequest, NextResponse } from 'next/server'
import { list, get, del } from '@vercel/blob'

export async function GET(request: NextRequest) {
  try {
    // List all files in blob storage
    const { blobs } = await list()
    
    // Filter user photos (typically stored with user_id in path)
    const photos = blobs.filter(blob => 
      blob.pathname.includes('body_photos') || 
      blob.pathname.includes('photos/')
    )

    return NextResponse.json({
      totalPhotos: photos.length,
      photos: photos.map(p => ({
        pathname: p.pathname,
        size: p.size,
        uploadedAt: p.uploadedAt
      }))
    })
  } catch (error) {
    console.error('Error listing photos:', error)
    return NextResponse.json({ error: 'Failed to list photos' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { blobs } = await list()
    
    // Find and delete all photos
    const photosToDelete = blobs.filter(blob => 
      blob.pathname.includes('body_photos') || 
      blob.pathname.includes('photos/')
    )

    let deletedCount = 0
    for (const photo of photosToDelete) {
      try {
        await del(photo.url)
        deletedCount++
      } catch (err) {
        console.error(`Failed to delete ${photo.pathname}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      total: photosToDelete.length
    })
  } catch (error) {
    console.error('Error deleting photos:', error)
    return NextResponse.json({ error: 'Failed to delete photos' }, { status: 500 })
  }
}
