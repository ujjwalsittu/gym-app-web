import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await request.json()

    // Store the push subscription
    await sql`
      INSERT INTO push_subscriptions (
        user_id, 
        endpoint, 
        p256dh_key, 
        auth_key
      )
      VALUES (
        ${user.id},
        ${subscription.endpoint},
        ${subscription.keys?.p256dh || ''},
        ${subscription.keys?.auth || ''}
      )
      ON CONFLICT (endpoint) 
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh_key = EXCLUDED.p256dh_key,
        auth_key = EXCLUDED.auth_key,
        created_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscribe error:', error)
    return NextResponse.json(
      { error: 'Subscription failed' },
      { status: 500 }
    )
  }
}
