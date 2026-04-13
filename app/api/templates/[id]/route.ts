import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const [template] = await sql`
      SELECT 
        wt.*,
        p.full_name as creator_name,
        (SELECT COUNT(*) FROM template_ratings WHERE template_id = wt.id) as rating_count,
        (SELECT AVG(rating) FROM template_ratings WHERE template_id = wt.id) as avg_rating,
        (SELECT rating FROM template_ratings WHERE template_id = wt.id AND user_id = ${user.id}) as user_rating
      FROM workout_templates wt
      LEFT JOIN users u ON wt.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE wt.id = ${id}
    `

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { action, rating } = await request.json()

    if (action === 'use') {
      // Increment use count
      await sql`
        UPDATE workout_templates 
        SET use_count = use_count + 1 
        WHERE id = ${id}
      `
      return NextResponse.json({ success: true })
    }

    if (action === 'rate') {
      // Add or update rating
      await sql`
        INSERT INTO template_ratings (template_id, user_id, rating)
        VALUES (${id}, ${user.id}, ${rating})
        ON CONFLICT (template_id, user_id) 
        DO UPDATE SET rating = ${rating}, updated_at = NOW()
      `
      return NextResponse.json({ success: true })
    }

    if (action === 'duplicate') {
      // Get original template
      const [original] = await sql`
        SELECT * FROM workout_templates WHERE id = ${id}
      `

      if (!original) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      // Create copy
      const [copy] = await sql`
        INSERT INTO workout_templates (
          name, description, category, difficulty, estimated_duration, 
          exercises, tags, is_public, user_id
        )
        VALUES (
          ${original.name + ' (Copy)'}, 
          ${original.description}, 
          ${original.category},
          ${original.difficulty},
          ${original.estimated_duration},
          ${JSON.stringify(original.exercises)}, 
          ${original.tags},
          false, 
          ${user.id}
        )
        RETURNING *
      `

      return NextResponse.json({ template: copy })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error with template action:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Only allow deleting own templates
    await sql`
      DELETE FROM workout_templates 
      WHERE id = ${id} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
