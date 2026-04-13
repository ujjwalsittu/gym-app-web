import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, category, equipment, gender, difficulty } = await request.json()

    if (!name || !category || !equipment || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert into database
    const result = await sql`
      INSERT INTO exercise_library (
        name,
        category,
        equipment,
        gender,
        difficulty,
        is_active
      )
      VALUES (
        ${name},
        ${category},
        ${equipment},
        ${gender},
        ${difficulty || 'intermediate'},
        true
      )
      RETURNING id, name, category, equipment, gender, difficulty
    `

    return NextResponse.json({
      success: true,
      exercise: result[0]
    })
  } catch (error) {
    console.error('Error adding exercise:', error)
    return NextResponse.json(
      { error: 'Failed to add exercise' },
      { status: 500 }
    )
  }
}
