import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'
import webpush from 'web-push'

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@visionaryfit.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

interface PushPayload {
  title: string
  body: string
  url?: string
  type?: 'water' | 'workout' | 'meal' | 'walk' | 'general'
  actions?: Array<{ action: string; title: string }>
  tag?: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: PushPayload = await request.json()

    // Get user's push subscriptions
    const subscriptions = await sql`
      SELECT endpoint, p256dh_key, auth_key 
      FROM push_subscriptions 
      WHERE user_id = ${user.id}
    `

    if (!subscriptions.length) {
      return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 })
    }

    // Set default actions based on type
    let actions = payload.actions
    if (!actions) {
      switch (payload.type) {
        case 'water':
          actions = [
            { action: 'log_water', title: 'Log Water' },
            { action: 'dismiss', title: 'Later' }
          ]
          break
        case 'workout':
          actions = [
            { action: 'start_workout', title: 'Start Workout' },
            { action: 'dismiss', title: 'Skip Today' }
          ]
          break
        default:
          actions = []
      }
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/dashboard',
      type: payload.type,
      actions,
      tag: payload.tag || payload.type || 'general'
    })

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key
            }
          },
          notificationPayload
        )
      )
    )

    // Remove failed subscriptions (expired/invalid)
    const failedEndpoints = results
      .map((result, index) => {
        if (result.status === 'rejected') {
          return subscriptions[index].endpoint
        }
        return null
      })
      .filter(Boolean)

    if (failedEndpoints.length) {
      await sql`
        DELETE FROM push_subscriptions 
        WHERE endpoint = ANY(${failedEndpoints})
      `
    }

    const successCount = results.filter(r => r.status === 'fulfilled').length

    return NextResponse.json({ 
      success: true, 
      sent: successCount,
      failed: failedEndpoints.length
    })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
