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

    let query = `
      SELECT 
        id,
        name,
        category,
        equipment,
        gender,
        difficulty,
        is_active,
        CASE WHEN lottie_data IS NOT NULL THEN true ELSE false END as has_animation
      FROM exercise_library
      WHERE 1=1
    `

    const params: any[] = []

    if (search) {
      query += ` AND LOWER(name) LIKE LOWER($${params.length + 1})`
      params.push(`%${search}%`)
    }

    if (category) {
      query += ` AND LOWER(category) = LOWER($${params.length + 1})`
      params.push(category)
    }

    query += ` ORDER BY category, name ASC LIMIT ${limit} OFFSET ${offset}`

    const exercises = await sql(query, params)

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM exercise_library WHERE 1=1'
    if (search) {
      countQuery += ` AND LOWER(name) LIKE LOWER($1)`
    }
    if (category) {
      countQuery += ` AND LOWER(category) = LOWER($${search ? 2 : 1})`
    }

    const countResult = await sql(countQuery, search && category ? [search, category] : search ? [search] : category ? [category] : [])

    return NextResponse.json({
      exercises,
      total: parseInt(countResult[0].total) || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
  }
}
