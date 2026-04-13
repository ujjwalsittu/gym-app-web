import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import JSZip from 'jszip'

// Helper to convert filename to exercise name
function filenameToExerciseName(filename: string): string {
  return filename
    .replace(/\.(mp4|webm|mov)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim()
}

// Helper to normalize exercise name for matching
function normalizeExerciseName(name: string): string {
  return name.toLowerCase().replace(/[-_\s]+/g, ' ').trim()
}

export async function POST(request: NextRequest) {
  try {
    // Check auth (optional: add admin check here)
    const session = await getSession()
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new Response('No file provided', { status: 400 })
    }

    // Create a readable stream for progress updates
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Read ZIP file
          const arrayBuffer = await file.arrayBuffer()
          const zip = await JSZip.loadAsync(arrayBuffer)
          
          // Get all video files
          const videoFiles: { path: string; file: JSZip.JSZipObject }[] = []
          
          zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && /\.(mp4|webm|mov)$/i.test(relativePath)) {
              videoFiles.push({ path: relativePath, file: zipEntry })
            }
          })

          const total = videoFiles.length
          let processed = 0

          // Send initial progress
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'progress',
            total,
            processed: 0,
            currentFile: 'Starting...'
          }) + '\n'))

          // Process each video
          for (const { path, file: zipEntry } of videoFiles) {
            const pathParts = path.split('/')
            const filename = pathParts.pop() || ''
            
            // Determine category and subcategory from path
            let category = 'General'
            let subcategory = ''
            
            if (pathParts.length >= 1) {
              category = pathParts[0]
            }
            if (pathParts.length >= 2) {
              subcategory = pathParts[1]
            }

            const exerciseName = filenameToExerciseName(filename)
            const normalizedName = normalizeExerciseName(exerciseName)

            // Send progress update
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'progress',
              total,
              processed,
              currentFile: exerciseName
            }) + '\n'))

            try {
              // Extract video content
              const videoContent = await zipEntry.async('arraybuffer')
              
              // Upload to Vercel Blob
              const blob = await put(
                `exercises/${category}/${subcategory}/${filename}`.replace(/\/+/g, '/'),
                videoContent,
                {
                  access: 'public',
                  contentType: 'video/mp4'
                }
              )

              // Check if exercise exists in database
              const existing = await sql`
                SELECT id FROM exercise_library 
                WHERE LOWER(REPLACE(REPLACE(name, '-', ' '), '_', ' ')) = ${normalizedName}
                LIMIT 1
              `

              if (existing.length > 0) {
                // Update existing exercise
                await sql`
                  UPDATE exercise_library 
                  SET video_url = ${blob.url},
                      category = ${category}
                  WHERE id = ${existing[0].id}
                `
              } else {
                // Insert new exercise
                await sql`
                  INSERT INTO exercise_library (name, category, video_url, difficulty, equipment, gender, is_active)
                  VALUES (
                    ${exerciseName},
                    ${category},
                    ${blob.url},
                    'intermediate',
                    ${category},
                    'unisex',
                    true
                  )
                `
              }

              // Send success result
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'result',
                result: {
                  success: true,
                  exerciseName,
                  category,
                  subcategory,
                  videoUrl: blob.url
                }
              }) + '\n'))

            } catch (error) {
              // Send error result
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'result',
                result: {
                  success: false,
                  exerciseName,
                  category,
                  subcategory,
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              }) + '\n'))
            }

            processed++
          }

          // Send completion
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'complete',
            total,
            processed: total
          }) + '\n'))

          controller.close()
        } catch (error) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Processing failed'
          }) + '\n'))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return new Response('Upload failed', { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
