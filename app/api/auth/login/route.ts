import { NextResponse } from 'next/server'
import { authenticateUser, setSessionCookie } from '@/lib/auth'
import { isUserAdmin } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Authenticate user
    const authResult = await authenticateUser(email, password)
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Set session cookie
    await setSessionCookie(authResult.sessionToken)

    // Check if user is admin
    const isAdmin = await isUserAdmin(authResult.user.id)
    
    return NextResponse.json({
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        onboarding_completed: authResult.user.onboarding_completed,
        isAdmin
      },
      redirect: isAdmin ? '/admin/dashboard' : (authResult.user.onboarding_completed ? '/dashboard' : '/onboarding')
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
