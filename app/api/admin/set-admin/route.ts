import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isUserAdmin, setUserAsAdmin } from '@/lib/admin'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow if user is already admin or if this is the first call
    const isAdmin = await isUserAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const success = await setUserAsAdmin(email)

    if (success) {
      return NextResponse.json({ success: true, message: `${email} is now an admin` })
    } else {
      return NextResponse.json({ error: 'Failed to set admin' }, { status: 500 })
    }
  } catch (error) {
    console.error('Set admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
