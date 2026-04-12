import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const sessionData = await getSession()
    
    if (!sessionData) {
      return NextResponse.json({ user: null })
    }
    
    return NextResponse.json({
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        onboarding_completed: sessionData.user.onboarding_completed
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null })
  }
}
