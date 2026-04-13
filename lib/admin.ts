import { sql } from '@/lib/db'

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT is_admin FROM users WHERE id = ${userId}
    `
    return result.length > 0 && result[0].is_admin === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function setUserAsAdmin(email: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE users 
      SET is_admin = true 
      WHERE email = ${email}
      RETURNING id, email, is_admin
    `
    return result.length > 0 && result[0].is_admin === true
  } catch (error) {
    console.error('Error setting admin:', error)
    return false
  }
}

export async function removeAdminAccess(email: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE users 
      SET is_admin = false 
      WHERE email = ${email}
      RETURNING id, email, is_admin
    `
    return result.length > 0 && result[0].is_admin === false
  } catch (error) {
    console.error('Error removing admin:', error)
    return false
  }
}

export async function getAllAdmins() {
  try {
    const admins = await sql`
      SELECT id, email, created_at 
      FROM users 
      WHERE is_admin = true
      ORDER BY created_at ASC
    `
    return admins
  } catch (error) {
    console.error('Error fetching admins:', error)
    return []
  }
}
