import { type NextRequest, NextResponse } from 'next/server'
import { get, list } from '@vercel/blob'
import { sql } from '@/lib/db'
import JSZip from 'jszip'

// Mapping for body parts standardization
const bodyPartMapping: Record<string, string> = {
  'ABS': 'abs',
  'ARMS': 'arms',
  'BACK': 'back',
  'BICEPS': 'arms',
  'CARDIO': 'cardio',
  'CHEST': 'chest',
  'CORE': 'abs',
  'GLUTES': 'legs',
  'HAMSTRINGS': 'legs',
  'LEGS': 'legs',
  'QUADS': 'legs',
  'SHOULDERS': 'shoulders',
  'TRICEPS': 'arms',
}

const genderMapping: Record<string, string> = {
  'MEN': 'male',
  'WOMEN': 'female',
  'UNISEX': 'unisex',
}

function normalizeExerciseName(name: string): string {
  // Remove file extension
  const withoutExt = name.replace(/\.(json|lottie)$/i, '')
  // Replace underscores and hyphens with spaces
  const withSpaces = withoutExt.replace(/[_-]/g, ' ')
  // Convert to lowercase and trim
  return withSpaces.toLowerCase().trim()
}

function generateSlug(name: string, equipment: string, gender: string): string {
  // Create a URL-friendly slug from name, equipment, and gender
  const combined = `${name}-${equipment}-${gender}`
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const { zipPath = 'users/Archive.zip' } = await request.json()

    // List blobs to find the ZIP file
    const { blobs } = await list()
    const zipBlob = blobs.find(b => b.pathname === zipPath || b.pathname.endsWith('Archive.zip'))

    if (!zipBlob) {
      return NextResponse.json(
        { error: `ZIP file not found at ${zipPath}` },
        { status: 404 }
      )
    }

    // Download ZIP from blob storage
    const result = await get(zipBlob.pathname, { access: 'private' })
    if (!result) {
      return NextResponse.json({ error: 'Failed to download ZIP' }, { status: 500 })
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const reader = result.stream.getReader()
    let chunk = await reader.read()
    while (!chunk.done) {
      chunks.push(chunk.value)
      chunk = await reader.read()
    }
    const zipBuffer = Buffer.concat(chunks.map(c => Buffer.from(c)))

    // Extract ZIP
    const zip = new JSZip()
    await zip.loadAsync(zipBuffer)

    let processedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    // Iterate through ZIP contents
    for (const [filePath, file] of Object.entries(zip.files)) {
      // Skip directories and hidden files
      if (file.dir || filePath.includes('.DS_Store') || filePath.startsWith('__MACOSX')) {
        continue
      }

      // Only process JSON files
      if (!filePath.endsWith('.json')) {
        continue
      }

      try {
        // Parse path: Gender/Equipment/BodyPart/filename.json
        const pathParts = filePath.split('/').filter(p => p && !p.startsWith('_'))
        
        if (pathParts.length < 4) {
          skippedCount++
          continue
        }

        const [genderRaw, equipment, bodyPartRaw, filenameWithExt] = pathParts.slice(-4)
        
        const gender = genderMapping[genderRaw.toUpperCase()] || genderRaw.toLowerCase()
        const bodyPart = bodyPartMapping[bodyPartRaw.toUpperCase()] || bodyPartRaw.toLowerCase()
        const exerciseName = normalizeExerciseName(filenameWithExt)
        const slug = generateSlug(exerciseName, equipment, gender)

        // Read JSON content
        const jsonContent = await file.async('string')
        const lottieData = JSON.parse(jsonContent)

        // Insert or update in database
        await sql`
          INSERT INTO exercise_library 
            (name, slug, equipment, category, gender, lottie_data, difficulty, is_active, created_at, updated_at)
          VALUES 
            (${exerciseName}, ${slug}, ${equipment}, ${bodyPart}, ${gender}, ${JSON.stringify(lottieData)}, 'intermediate', true, NOW(), NOW())
          ON CONFLICT (name, equipment, gender) 
          DO UPDATE SET 
            lottie_data = ${JSON.stringify(lottieData)},
            slug = ${slug},
            updated_at = NOW()
        `

        processedCount++
      } catch (error) {
        const errorMsg = `Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully processed ${processedCount} exercises from ZIP file`
    })
  } catch (error) {
    console.error('Lottie ZIP processing error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process Lottie ZIP',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST a request with zipPath to process Lottie animations',
    example: {
      zipPath: 'users/Archive.zip'
    }
  })
}
