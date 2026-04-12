import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be less than 10MB' }, { status: 400 })
    }

    const validTypes = ['photoFront', 'photoLeft', 'photoRight', 'gymVerification']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid photo type' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `users/${session.user.id}/${type}-${Date.now()}.${ext}`

    // Upload to Vercel Blob (private access)
    const blob = await put(filename, file, {
      access: 'private',
    })

    // Return the pathname for private blob access
    return NextResponse.json({ 
      url: `/api/file?pathname=${encodeURIComponent(blob.pathname)}`,
      pathname: blob.pathname 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
