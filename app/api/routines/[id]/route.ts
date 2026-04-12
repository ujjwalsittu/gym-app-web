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

    const [routine] = await sql`
      SELECT * FROM routines 
      WHERE id = ${id}
    `

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
    }

    return NextResponse.json({ routine })
  } catch (error) {
    console.error('Error fetching routine:', error)
    return NextResponse.json({ error: 'Failed to fetch routine' }, { status: 500 })
  }
}
