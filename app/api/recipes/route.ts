import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await sql`
      SELECT user_id FROM sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `
    
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const userId = sessions[0].user_id

    const recipes = await sql`
      SELECT * FROM recipes
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    // Parse JSON fields
    const parsedRecipes = recipes.map((r: any) => ({
      ...r,
      ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients,
      instructions: typeof r.instructions === 'string' ? JSON.parse(r.instructions) : r.instructions,
      tips: typeof r.tips === 'string' ? JSON.parse(r.tips) : r.tips
    }))

    return NextResponse.json({ recipes: parsedRecipes })
  } catch (error) {
    console.error('Recipes fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}
