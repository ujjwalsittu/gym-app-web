import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isUserAdmin } from '@/lib/admin'

export async function GET() {
  try {
    const sessionData = await getSession()
    
    if (!sessionData) {
      return NextResponse.json({ user: null })
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(sessionData.user.id)
    
    return NextResponse.json({
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        onboarding_completed: sessionData.user.onboarding_completed,
        isAdmin
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null })
  }
}
