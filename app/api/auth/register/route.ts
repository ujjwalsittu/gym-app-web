import { NextResponse } from 'next/server'
import { createUser, authenticateUser, setSessionCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body
    
    console.log('[v0] Registration attempt:', { email, name, passwordLength: password?.length })
    
    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }
    
    // Create user
    console.log('[v0] Creating user with email:', email)
    const user = await createUser(email, password, name)
    
    if (!user) {
      console.log('[v0] User creation failed - email may already exist')
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }
    
    console.log('[v0] User created successfully:', user.id)
    
    // Authenticate and create session
    console.log('[v0] Authenticating user...')
    const authResult = await authenticateUser(email, password)
    
    if (!authResult) {
      console.log('[v0] Authentication failed after user creation')
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }
    
    console.log('[v0] Authentication successful, setting session cookie')
    // Set session cookie
    await setSessionCookie(authResult.sessionToken)
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboarding_completed: user.onboarding_completed
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
