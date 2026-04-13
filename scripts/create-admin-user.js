import bcrypt from 'bcryptjs'
import { sql } from '@neondatabase/serverless'

async function createAdminUser() {
  try {
    const email = 'ujjwal@azeonics.com'
    const password = 'Sagar@4343'
    const name = 'Admin User'

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert the admin user
    const result = await sql`
      INSERT INTO users (email, password_hash, name, is_admin, onboarding_completed, created_at, updated_at)
      VALUES (${email}, ${hashedPassword}, ${name}, true, true, NOW(), NOW())
      RETURNING id, email, is_admin
    `

    console.log('✅ Admin user created successfully:')
    console.log('ID:', result[0].id)
    console.log('Email:', result[0].email)
    console.log('Is Admin:', result[0].is_admin)
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  }
}

createAdminUser()
