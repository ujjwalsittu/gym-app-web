import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/db'
import { sendTelegramMessage } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vfit_session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await sql`
      SELECT user_id FROM sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `
    
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const userId = sessions[0].user_id
    const { code } = await request.json()

    // Find telegram user with this code
    const telegramUser = await sql`
      SELECT * FROM telegram_users 
      WHERE link_code = ${code.toUpperCase()} 
        AND is_verified = false
        AND created_at > NOW() - INTERVAL '10 minutes'
    `

    if (telegramUser.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    // Link the accounts
    await sql`
      UPDATE telegram_users 
      SET user_id = ${userId}, is_verified = true, link_code = NULL
      WHERE id = ${telegramUser[0].id}
    `

    // Send confirmation to Telegram
    await sendTelegramMessage(
      telegramUser[0].telegram_chat_id,
      `<b>Account Linked!</b>\n\nYour VisionaryFit account is now connected. You'll receive workout reminders and can log progress right from Telegram!\n\nUse /help to see available commands.`
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Telegram link error:', error)
    return NextResponse.json({ error: 'Failed to link account' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vfit_session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await sql`
      SELECT user_id FROM sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `
    
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const userId = sessions[0].user_id

    const telegramUser = await sql`
      SELECT telegram_username, is_verified, created_at 
      FROM telegram_users 
      WHERE user_id = ${userId} AND is_verified = true
    `

    return NextResponse.json({ 
      isLinked: telegramUser.length > 0,
      username: telegramUser[0]?.telegram_username || null
    })
  } catch (error) {
    console.error('Telegram status error:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vfit_session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await sql`
      SELECT user_id FROM sessions 
      WHERE token = ${sessionToken} AND expires_at > NOW()
    `
    
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const userId = sessions[0].user_id

    await sql`
      DELETE FROM telegram_users WHERE user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Telegram unlink error:', error)
    return NextResponse.json({ error: 'Failed to unlink account' }, { status: 500 })
  }
}
