import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json({ error: 'Exercise name required' }, { status: 400 })
    }

    const normalizedName = name.toLowerCase().replace(/[-_\s]+/g, ' ').trim()

    // Try exact match first
    let result = await sql`
      SELECT video_url, category, subcategory, name 
      FROM exercise_library 
      WHERE LOWER(REPLACE(REPLACE(name, '-', ' '), '_', ' ')) = ${normalizedName}
      AND video_url IS NOT NULL
      LIMIT 1
    `

    // Try partial match if no exact match
    if (result.rows.length === 0) {
      result = await sql`
        SELECT video_url, category, subcategory, name 
        FROM exercise_library 
        WHERE (
          LOWER(name) LIKE ${'%' + normalizedName + '%'}
          OR LOWER(REPLACE(REPLACE(name, '-', ' '), '_', ' ')) LIKE ${'%' + normalizedName + '%'}
        )
        AND video_url IS NOT NULL
        LIMIT 1
      `
    }

    if (result.rows.length > 0) {
      return NextResponse.json({
        videoUrl: result.rows[0].video_url,
        category: result.rows[0].category,
        subcategory: result.rows[0].subcategory,
        name: result.rows[0].name
      })
    }

    return NextResponse.json({ videoUrl: null })
  } catch (error) {
    console.error('Error fetching exercise video:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}
