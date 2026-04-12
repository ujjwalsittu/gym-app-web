import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await sql`
      SELECT * FROM reminder_settings WHERE user_id = ${user.id}
    `

    if (!settings.length) {
      // Return default settings
      return NextResponse.json({
        water_reminder: true,
        water_interval_minutes: 60,
        workout_reminder: true,
        workout_time: '07:00',
        walk_reminder: true,
        walk_interval_hours: 2,
        meal_reminders: true,
        meal_times: ['08:00', '13:00', '19:00']
      })
    }

    return NextResponse.json(settings[0])
  } catch (error) {
    console.error('Get reminders error:', error)
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await request.json()

    await sql`
      INSERT INTO reminder_settings (
        user_id,
        water_reminder,
        water_interval_minutes,
        workout_reminder,
        workout_time,
        walk_reminder,
        walk_interval_hours,
        meal_reminders,
        meal_times
      )
      VALUES (
        ${user.id},
        ${settings.water_reminder ?? true},
        ${settings.water_interval_minutes ?? 60},
        ${settings.workout_reminder ?? true},
        ${settings.workout_time ?? '07:00'},
        ${settings.walk_reminder ?? true},
        ${settings.walk_interval_hours ?? 2},
        ${settings.meal_reminders ?? true},
        ${JSON.stringify(settings.meal_times ?? ['08:00', '13:00', '19:00'])}
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        water_reminder = EXCLUDED.water_reminder,
        water_interval_minutes = EXCLUDED.water_interval_minutes,
        workout_reminder = EXCLUDED.workout_reminder,
        workout_time = EXCLUDED.workout_time,
        walk_reminder = EXCLUDED.walk_reminder,
        walk_interval_hours = EXCLUDED.walk_interval_hours,
        meal_reminders = EXCLUDED.meal_reminders,
        meal_times = EXCLUDED.meal_times,
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save reminders error:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
