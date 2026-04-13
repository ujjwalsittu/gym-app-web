import { list } from '@vercel/blob'
import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import JSZip from 'jszip'

// Parse exercise name from filename
function parseExerciseName(filename: string): string {
  return filename
    .replace(/\.json$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Normalize body part/category names
function normalizeCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'arm': 'Arms',
    'arms': 'Arms',
    'ARMS': 'Arms',
    'back': 'Back',
    'BACK': 'Back',
    'chest': 'Chest',
    'CHEST': 'Chest',
    'leg': 'Legs',
    'legs': 'Legs',
    'LEGS': 'Legs',
    'shoulder': 'Shoulders',
    'shoulders': 'Shoulders',
    'SHOULDERS': 'Shoulders',
    'ab': 'Core',
    'abs': 'Core',
    'ABS': 'Core',
    'core': 'Core',
    'CORE': 'Core',
    'cardio': 'Cardio',
    'CARDIO': 'Cardio',
    'full body': 'Full Body',
    'FULL BODY': 'Full Body',
    'glute': 'Glutes',
    'glutes': 'Glutes',
    'GLUTES': 'Glutes'
  }
  return categoryMap[category.toLowerCase()] || category
}

// Normalize equipment type
function normalizeEquipment(equipment: string): string {
  const equipmentMap: Record<string, string> = {
    'band': 'Band',
    'bands': 'Band',
    'barbell': 'Barbell',
    'bodyweight': 'Bodyweight',
    'body weight': 'Bodyweight',
    'cable': 'Cable',
    'cables': 'Cable',
    'dumbbell': 'Dumbbell',
    'dumbbells': 'Dumbbell',
    'kettlebell': 'Kettlebell',
    'kettlebells': 'Kettlebell',
    'machine': 'Machine',
    'machines': 'Machine',
    'plate': 'Plate',
    'plates': 'Plate',
    'smith machine': 'Smith Machine',
    'trx': 'TRX',
    'ez bar': 'EZ Bar',
    'ezbar': 'EZ Bar'
  }
  return equipmentMap[equipment.toLowerCase()] || equipment
}

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the Archive.zip in blob storage
    const { blobs } = await list({ prefix: 'users/' })
    const zipBlob = blobs.find(b => b.pathname.toLowerCase().includes('archive.zip'))

    if (!zipBlob) {
      return NextResponse.json({ error: 'Archive.zip not found in blob storage' }, { status: 404 })
    }

    console.log('[v0] Found ZIP file:', zipBlob.pathname)

    // Download the ZIP file
    const response = await fetch(zipBlob.url)
    const arrayBuffer = await response.arrayBuffer()

    // Extract the ZIP
    const zip = await JSZip.loadAsync(arrayBuffer)
    
    let processed = 0
    let errors: string[] = []
    const exercises: any[] = []

    // Process each file in the ZIP
    // Expected structure: Gender/Equipment/BodyPart/exercise-name.json
    // OR: Free Exercise Pack/Gender/Equipment/BodyPart/exercise-name.json
    for (const [path, file] of Object.entries(zip.files)) {
      // Skip directories, .DS_Store, and non-JSON files
      if (file.dir || path.includes('.DS_Store') || !path.endsWith('.json')) {
        continue
      }

      try {
        // Parse the path to extract metadata
        const parts = path.split('/').filter(p => p && !p.startsWith('__MACOSX'))
        
        // Skip if not enough path parts
        if (parts.length < 4) {
          console.log('[v0] Skipping invalid path:', path)
          continue
        }

        // Handle both structures:
        // 1. Gender/Equipment/BodyPart/file.json
        // 2. Free Exercise Pack/Gender/Equipment/BodyPart/file.json
        let gender: string, equipment: string, category: string, filename: string

        // Check if first part is "Free Exercise Pack" or similar
        if (parts[0].toLowerCase().includes('exercise') || parts[0].toLowerCase().includes('pack')) {
          // Skip the pack folder name
          gender = parts[1]
          equipment = parts[2]
          category = parts[3]
          filename = parts[4] || parts[3] // Handle edge cases
        } else {
          gender = parts[0]
          equipment = parts[1]
          category = parts[2]
          filename = parts[3]
        }

        // Validate gender
        if (!['men', 'women', 'male', 'female'].includes(gender.toLowerCase())) {
          // Try next level
          if (parts.length >= 5) {
            gender = parts[1]
            equipment = parts[2]
            category = parts[3]
            filename = parts[4]
          } else {
            console.log('[v0] Invalid gender in path:', path)
            continue
          }
        }

        // Normalize values
        const normalizedGender = gender.toLowerCase() === 'women' || gender.toLowerCase() === 'female' ? 'Women' : 'Men'
        const normalizedEquipment = normalizeEquipment(equipment)
        const normalizedCategory = normalizeCategory(category)
        const exerciseName = parseExerciseName(filename)

        // Read the JSON content
        const content = await file.async('string')
        let lottieData: any

        try {
          lottieData = JSON.parse(content)
        } catch (parseErr) {
          errors.push(`Invalid JSON in ${path}`)
          continue
        }

        exercises.push({
          name: exerciseName,
          category: normalizedCategory,
          equipment: normalizedEquipment,
          gender: normalizedGender,
          lottieData,
          path
        })

        processed++
      } catch (err) {
        errors.push(`Error processing ${path}: ${err}`)
      }
    }

    console.log(`[v0] Processed ${processed} files, inserting into database...`)

    // Batch insert into database
    let inserted = 0
    for (const exercise of exercises) {
      try {
        await sql`
          INSERT INTO exercise_library (name, category, equipment, gender, lottie_data, is_active)
          VALUES (
            ${exercise.name},
            ${exercise.category},
            ${exercise.equipment},
            ${exercise.gender},
            ${JSON.stringify(exercise.lottieData)},
            true
          )
          ON CONFLICT (name, equipment, gender) 
          DO UPDATE SET 
            category = EXCLUDED.category,
            lottie_data = EXCLUDED.lottie_data,
            is_active = true
        `
        inserted++
      } catch (dbErr: any) {
        errors.push(`DB error for ${exercise.name}: ${dbErr.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      inserted,
      errors: errors.slice(0, 20), // Limit error output
      totalErrors: errors.length
    })

  } catch (error: any) {
    console.error('[v0] Error processing ZIP:', error)
    return NextResponse.json({ error: error.message || 'Failed to process ZIP' }, { status: 500 })
  }
}

// GET to check status
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Count exercises in database
    const result = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT category) as categories,
        COUNT(DISTINCT equipment) as equipment_types,
        COUNT(DISTINCT gender) as genders
      FROM exercise_library
      WHERE is_active = true
    `

    // Get breakdown by category
    const categoryBreakdown = await sql`
      SELECT category, COUNT(*) as count
      FROM exercise_library
      WHERE is_active = true
      GROUP BY category
      ORDER BY count DESC
    `

    // Get breakdown by equipment
    const equipmentBreakdown = await sql`
      SELECT equipment, COUNT(*) as count
      FROM exercise_library
      WHERE is_active = true
      GROUP BY equipment
      ORDER BY count DESC
    `

    return NextResponse.json({
      stats: result[0],
      byCategory: categoryBreakdown,
      byEquipment: equipmentBreakdown
    })

  } catch (error: any) {
    console.error('[v0] Error getting stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
