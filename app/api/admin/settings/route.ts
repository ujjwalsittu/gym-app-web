import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isUserAdmin } from '@/lib/admin'
import { sql } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await sql`
      SELECT * FROM admin_settings
      LIMIT 1
    `

    const currentSettings = settings[0] || {
      max_exercises_per_day: 10,
      enable_telegram_notifications: false,
      enable_email_notifications: true,
      max_users: 1000,
      maintenance_mode: false
    }

    return NextResponse.json(currentSettings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch settings' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await request.json()

    // Delete existing settings and insert new ones
    await sql`DELETE FROM admin_settings`
    
    const result = await sql`
      INSERT INTO admin_settings 
        (max_exercises_per_day, enable_telegram_notifications, enable_email_notifications, max_users, maintenance_mode, updated_at)
      VALUES 
        (${settings.max_exercises_per_day || 10},
         ${settings.enable_telegram_notifications || false},
         ${settings.enable_email_notifications || true},
         ${settings.max_users || 1000},
         ${settings.maintenance_mode || false},
         NOW())
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      settings: result[0]
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ 
      error: 'Failed to save settings' 
    }, { status: 500 })
  }
}
