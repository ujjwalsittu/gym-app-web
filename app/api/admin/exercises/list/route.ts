import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isUserAdmin } from '@/lib/admin'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use template literal SQL with proper filtering
    let exercises
    let countResult

    if (search && category) {
      const searchPattern = `%${search.toLowerCase()}%`
      exercises = await sql`
        SELECT id, name, category, equipment, gender, difficulty, is_active,
               CASE WHEN lottie_data IS NOT NULL THEN true ELSE false END as has_animation
        FROM exercise_library
        WHERE LOWER(name) LIKE ${searchPattern}
          AND LOWER(category) = ${category.toLowerCase()}
        ORDER BY category, name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM exercise_library
        WHERE LOWER(name) LIKE ${searchPattern}
          AND LOWER(category) = ${category.toLowerCase()}
      `
    } else if (search) {
      const searchPattern = `%${search.toLowerCase()}%`
      exercises = await sql`
        SELECT id, name, category, equipment, gender, difficulty, is_active,
               CASE WHEN lottie_data IS NOT NULL THEN true ELSE false END as has_animation
        FROM exercise_library
        WHERE LOWER(name) LIKE ${searchPattern}
        ORDER BY category, name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM exercise_library
        WHERE LOWER(name) LIKE ${searchPattern}
      `
    } else if (category) {
      exercises = await sql`
        SELECT id, name, category, equipment, gender, difficulty, is_active,
               CASE WHEN lottie_data IS NOT NULL THEN true ELSE false END as has_animation
        FROM exercise_library
        WHERE LOWER(category) = ${category.toLowerCase()}
        ORDER BY category, name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM exercise_library
        WHERE LOWER(category) = ${category.toLowerCase()}
      `
    } else {
      exercises = await sql`
        SELECT id, name, category, equipment, gender, difficulty, is_active,
               CASE WHEN lottie_data IS NOT NULL THEN true ELSE false END as has_animation
        FROM exercise_library
        ORDER BY category, name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`SELECT COUNT(*) as total FROM exercise_library`
    }

    return NextResponse.json({
      exercises,
      total: parseInt(countResult[0]?.total) || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
  }
}
