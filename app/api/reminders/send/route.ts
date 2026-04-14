import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import webpush from 'web-push'

// Configure web push
webpush.setVapidDetails(
  `mailto:${process.env.WEBPUSH_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    // Verify it's a cron call
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()

    // Get all active reminders for this day and time
    const reminders = await sql`
      SELECT 
        rs.id,
        rs.user_id,
        rs.reminder_type,
        rs.times,
        rs.days_of_week,
        u.email,
        ps.endpoint,
        ps.auth_key,
        ps.p256dh_key
      FROM reminder_settings rs
      JOIN users u ON rs.user_id = u.id
      LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
      WHERE rs.enabled = true
        AND ps.endpoint IS NOT NULL
        AND ${dayOfWeek} = ANY(rs.days_of_week)
        AND ps.is_active = true
    `

    let sentCount = 0
    let failedCount = 0

    for (const reminder of reminders) {
      // Check if this is the right time
      const times = reminder.times as string[]
      const shouldSendNow = times.some((time) => {
        const [hour, minute] = time.split(':').map(Number)
        return hour === currentHour && minute === currentMinutes
      })

      if (!shouldSendNow) continue

      try {
        const message = getReminderMessage(reminder.reminder_type)

        const payload = JSON.stringify({
          title: message.title,
          body: message.body,
          icon: '/icon.svg',
          badge: '/badge.png',
          tag: `reminder-${reminder.id}`,
          requireInteraction: false,
          data: {
            reminderType: reminder.reminder_type,
            url: message.url,
          },
        })

        // Send push notification
        await webpush.sendNotification(
          {
            endpoint: reminder.endpoint,
            keys: {
              auth: reminder.auth_key,
              p256dh: reminder.p256dh_key,
            },
          },
          payload
        )

        sentCount++
      } catch (error) {
        console.error(`[v0] Failed to send reminder to user ${reminder.user_id}:`, error)
        failedCount++

        // If subscription is invalid, mark as inactive
        if (error instanceof Error && error.message.includes('410')) {
          await sql`
            UPDATE push_subscriptions
            SET is_active = false
            WHERE endpoint = ${reminder.endpoint}
          `
        }
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      totalReminders: reminders.length,
    })
  } catch (error) {
    console.error('[v0] Reminder send error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    )
  }
}

function getReminderMessage(type: string) {
  const messages: Record<string, { title: string; body: string; url: string }> = {
    workout: {
      title: 'Time for your workout! 💪',
      body: 'Your scheduled workout is starting soon. Let\'s get strong!',
      url: '/workout-plan',
    },
    water: {
      title: 'Hydration reminder 💧',
      body: 'Don\'t forget to drink water! Stay hydrated throughout the day.',
      url: '/dashboard',
    },
    meal: {
      title: 'Meal time 🍽️',
      body: 'It\'s time for your scheduled meal. Track your nutrition!',
      url: '/nutrition',
    },
    stretching: {
      title: 'Stretching time 🧘',
      body: 'Time for your mobility and stretching routine.',
      url: '/dashboard',
    },
    progress_photo: {
      title: 'Progress photo day 📸',
      body: 'It\'s time to take your weekly progress photos!',
      url: '/dashboard',
    },
    weight_check: {
      title: 'Weekly weigh-in 📊',
      body: 'Time to log your weight and track your progress.',
      url: '/dashboard',
    },
  }

  return messages[type] || {
    title: 'Reminder',
    body: 'You have a reminder!',
    url: '/dashboard',
  }
}
