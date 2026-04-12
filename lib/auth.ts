import { sql } from './db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SESSION_COOKIE_NAME = 'vfit_session'
const SESSION_DURATION_DAYS = 30

export interface User {
  id: string
  email: string
  name: string
  onboarding_completed: boolean
  created_at: Date
}

export interface Session {
  id: string
  user_id: string
  expires_at: Date
}

// Generate a secure random session token
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create a new user account
export async function createUser(email: string, password: string, name: string): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(password)
    
    const result = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${name})
      RETURNING id, email, name, onboarding_completed, created_at
    `
    
    return result[0] as User
  } catch (error: unknown) {
    // Check for unique constraint violation (duplicate email)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return null
    }
    throw error
  }
}

// Authenticate user and create session
export async function authenticateUser(email: string, password: string): Promise<{ user: User; sessionToken: string } | null> {
  const result = await sql`
    SELECT id, email, password_hash, name, onboarding_completed, created_at
    FROM users
    WHERE email = ${email.toLowerCase()}
  `
  
  if (result.length === 0) {
    return null
  }
  
  const user = result[0]
  const isValidPassword = await verifyPassword(password, user.password_hash)
  
  if (!isValidPassword) {
    return null
  }
  
  // Create session
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)
  
  await sql`
    INSERT INTO sessions (user_id, session_token, expires_at)
    VALUES (${user.id}, ${sessionToken}, ${expiresAt})
  `
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      onboarding_completed: user.onboarding_completed,
      created_at: user.created_at
    },
    sessionToken
  }
}

// Set session cookie
export async function setSessionCookie(sessionToken: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60
  })
}

// Get current user (returns user or null, doesn't redirect)
export async function getCurrentUser(): Promise<User | null> {
  const sessionData = await getSession()
  return sessionData?.user || null
}

// Get current session from cookie
export async function getSession(): Promise<{ session: Session; user: User } | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (!sessionToken) {
    return null
  }
  
  const result = await sql`
    SELECT 
      s.id as session_id,
      s.user_id,
      s.expires_at,
      u.id,
      u.email,
      u.name,
      u.onboarding_completed,
      u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = ${sessionToken}
      AND s.expires_at > NOW()
  `
  
  if (result.length === 0) {
    return null
  }
  
  const row = result[0]
  
  return {
    session: {
      id: row.session_id,
      user_id: row.user_id,
      expires_at: row.expires_at
    },
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      onboarding_completed: row.onboarding_completed,
      created_at: row.created_at
    }
  }
}

// Get current user or redirect to login
export async function requireAuth(): Promise<{ session: Session; user: User }> {
  const sessionData = await getSession()
  
  if (!sessionData) {
    redirect('/login')
  }
  
  return sessionData
}

// Get current user or redirect if onboarding not complete
export async function requireOnboardedUser(): Promise<{ session: Session; user: User }> {
  const sessionData = await requireAuth()
  
  if (!sessionData.user.onboarding_completed) {
    redirect('/onboarding')
  }
  
  return sessionData
}

// Logout - delete session
export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (sessionToken) {
    await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`
  }
  
  cookieStore.delete(SESSION_COOKIE_NAME)
}

// Delete expired sessions (for cleanup)
export async function cleanupExpiredSessions(): Promise<void> {
  await sql`DELETE FROM sessions WHERE expires_at < NOW()`
}
