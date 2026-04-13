import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name')
    const equipment = searchParams.get('equipment') || 'Dumbbell'
    const gender = searchParams.get('gender') || 'Men'

    if (!name) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      )
    }

    // Fetch Lottie data from database
    const result = await sql`
      SELECT lottie_data FROM exercise_library
      WHERE LOWER(name) = LOWER(${name})
      AND LOWER(equipment) = LOWER(${equipment})
      AND LOWER(gender) = LOWER(${gender})
      LIMIT 1
    `

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    const lottieData = JSON.parse(result.rows[0].lottie_data)

    return NextResponse.json({ lottieData })
  } catch (error) {
    console.error('Error fetching Lottie data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise animation' },
      { status: 500 }
    )
  }
}
