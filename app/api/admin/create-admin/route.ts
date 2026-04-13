import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    const result = await sql`
      INSERT INTO users (email, password_hash, name, is_admin, onboarding_completed, created_at, updated_at)
      VALUES (
        ${email},
        ${hashedPassword},
        ${name || 'Admin User'},
        true,
        true,
        NOW(),
        NOW()
      )
      RETURNING id, email, is_admin, name
    `

    return NextResponse.json({
      success: true,
      user: result[0]
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
  }
}
