import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { sql } from '@/lib/db'
import JSZip from 'jszip'

interface ExerciseData {
  name: string
  gender: string
  equipment: string
  category: string
  lottieJson: string
  filename: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read ZIP file
    const buffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)

    const exercises: ExerciseData[] = []
    const bodyPartMap: Record<string, string> = {
      'abs': 'ABS',
      'arm': 'ARMS',
      'arms': 'ARMS',
      'back': 'BACK',
      'bicep': 'ARMS',
      'chest': 'CHEST',
      'cardio': 'CARDIO',
      'core': 'ABS',
      'leg': 'LEGS',
      'legs': 'LEGS',
      'shoulder': 'SHOULDERS',
      'glute': 'LEGS',
      'hamstring': 'LEGS',
      'quad': 'LEGS',
      'tricep': 'ARMS',
      'trap': 'BACK'
    }

    // Parse ZIP structure: Gender/Equipment/BodyPart/filename.json
    for (const [filePath, file] of Object.entries(zip.files)) {
      // Skip directories and .DS_Store
      if (file.dir || filePath.includes('.DS_Store')) continue

      const parts = filePath.split('/')
      
      // Should have at least 4 parts: Gender/Equipment/BodyPart/filename.json
      if (parts.length < 4) continue

      const [gender, equipment, bodyPart, ...filenameParts] = parts
      const filename = filenameParts.join('/')

      // Skip if not a JSON file
      if (!filename.endsWith('.json')) continue

      try {
        const content = await file.async('string')
        const lottieJson = JSON.parse(content)

        // Normalize body part name
        const normalizedBodyPart = Object.entries(bodyPartMap).find(
          ([key]) => bodyPart.toLowerCase().includes(key)
        )?.[1] || bodyPart.toUpperCase()

        // Exercise name from filename (remove .json and clean up)
        const exerciseName = filename
          .replace('.json', '')
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        exercises.push({
          name: exerciseName,
          gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(),
          equipment: equipment.charAt(0).toUpperCase() + equipment.slice(1).toLowerCase(),
          category: normalizedBodyPart,
          lottieJson: JSON.stringify(lottieJson),
          filename: filename
        })
      } catch (error) {
        console.error(`Error parsing ${filePath}:`, error)
        continue
      }
    }

    if (exercises.length === 0) {
      return NextResponse.json(
        { error: 'No valid Lottie JSON files found in ZIP' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob and insert into DB
    const uploadedExercises = []
    const categories = new Set<string>()

    for (const exercise of exercises) {
      try {
        categories.add(exercise.category)

        // Insert into database with lottie_data stored directly
        await sql`
          INSERT INTO exercise_library (
            name,
            category,
            equipment,
            gender,
            difficulty,
            lottie_data,
            is_active
          )
          VALUES (
            ${exercise.name},
            ${exercise.category},
            ${exercise.equipment},
            ${exercise.gender},
            'intermediate',
            ${exercise.lottieJson}::jsonb,
            true
          )
          ON CONFLICT (name, equipment, gender) 
          DO UPDATE SET 
            lottie_data = ${exercise.lottieJson}::jsonb,
            is_active = true
        `

        uploadedExercises.push({
          name: exercise.name,
          category: exercise.category,
          equipment: exercise.equipment,
          gender: exercise.gender
        })
      } catch (error) {
        console.error(`Error uploading ${exercise.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      count: uploadedExercises.length,
      summary: {
        categories: Array.from(categories),
        equipment: [...new Set(uploadedExercises.map(e => e.equipment))],
        genders: [...new Set(uploadedExercises.map(e => e.gender))]
      },
      exercises: uploadedExercises.slice(0, 10) // Return first 10 for preview
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
