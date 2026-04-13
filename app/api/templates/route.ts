import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // all, my, community, favorites
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let templates

    if (filter === 'my') {
      templates = await sql`
        SELECT 
          wt.*,
          p.full_name as creator_name,
          (SELECT COUNT(*) FROM template_ratings WHERE template_id = wt.id) as rating_count,
          (SELECT AVG(rating) FROM template_ratings WHERE template_id = wt.id) as avg_rating
        FROM workout_templates wt
        LEFT JOIN users u ON wt.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE wt.user_id = ${user.id}
        ORDER BY wt.created_at DESC
      `
    } else if (filter === 'community') {
      templates = await sql`
        SELECT 
          wt.*,
          p.full_name as creator_name,
          (SELECT COUNT(*) FROM template_ratings WHERE template_id = wt.id) as rating_count,
          (SELECT AVG(rating) FROM template_ratings WHERE template_id = wt.id) as avg_rating
        FROM workout_templates wt
        LEFT JOIN users u ON wt.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE wt.is_public = true AND wt.user_id != ${user.id}
        ORDER BY wt.usage_count DESC, wt.created_at DESC
      `
    } else {
      templates = await sql`
        SELECT 
          wt.*,
          p.full_name as creator_name,
          (SELECT COUNT(*) FROM template_ratings WHERE template_id = wt.id) as rating_count,
          (SELECT AVG(rating) FROM template_ratings WHERE template_id = wt.id) as avg_rating
        FROM workout_templates wt
        LEFT JOIN users u ON wt.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE wt.user_id = ${user.id} OR wt.is_public = true
        ORDER BY wt.usage_count DESC, wt.created_at DESC
      `
    }

    // Filter by category
    if (category && category !== 'all') {
      templates = templates.filter((t: any) => t.category === category)
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      templates = templates.filter((t: any) => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      name, 
      description, 
      category, 
      difficulty,
      estimatedMinutes,
      exercises, 
      tags,
      isPublic 
    } = await request.json()

    const [template] = await sql`
      INSERT INTO workout_templates (
        name, 
        description, 
        category,
        difficulty,
        estimated_duration,
        exercises, 
        tags,
        is_public, 
        user_id
      )
      VALUES (
        ${name}, 
        ${description}, 
        ${category || 'general'},
        ${difficulty || 'intermediate'},
        ${estimatedMinutes || 45},
        ${JSON.stringify(exercises)}, 
        ${tags || []},
        ${isPublic || false}, 
        ${user.id}
      )
      RETURNING *
    `

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
