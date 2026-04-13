import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'

// This route auto-deletes after first admin is created
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Check if any admin exists - if so, block this route
    const existingAdmin = await sql`
      SELECT id FROM users WHERE is_admin = true LIMIT 1
    `

    if (existingAdmin.length > 0) {
      return NextResponse.json({ error: 'Admin already exists. This route is disabled.' }, { status: 403 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user (users table has: id, email, password_hash, is_admin, created_at, updated_at)
    const result = await sql`
      INSERT INTO users (id, email, password_hash, is_admin, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${email},
        ${hashedPassword},
        true,
        NOW(),
        NOW()
      )
      RETURNING id, email, is_admin
    `

    // Create user_profiles entry for onboarding status
    await sql`
      INSERT INTO user_profiles (id, user_id, onboarding_completed, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${result[0].id},
        true,
        NOW(),
        NOW()
      )
    `

    return NextResponse.json({
      success: true,
      user: result[0],
      message: 'Admin created. This route is now disabled.'
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
  }
}
