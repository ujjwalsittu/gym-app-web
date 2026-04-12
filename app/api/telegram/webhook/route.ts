import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendTelegramMessage, createInlineKeyboard } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    
    // Handle regular messages
    if (update.message) {
      const chatId = update.message.chat.id.toString()
      const text = update.message.text || ''
      const fromUser = update.message.from

      // Check if user is linked
      const telegramUser = await sql`
        SELECT * FROM telegram_users WHERE telegram_chat_id = ${chatId}
      `

      if (text === '/start') {
        if (telegramUser.length > 0) {
          await sendTelegramMessage(chatId, 
            `<b>Welcome back!</b>\n\nYou're already connected to VisionaryFit.\n\nUse /help to see available commands.`
          )
        } else {
          // Generate linking code
          const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase()
          
          // Store pending link
          await sql`
            INSERT INTO telegram_users (telegram_chat_id, telegram_username, link_code, is_verified)
            VALUES (${chatId}, ${fromUser.username || ''}, ${linkCode}, false)
            ON CONFLICT (telegram_chat_id) 
            DO UPDATE SET link_code = ${linkCode}, is_verified = false
          `

          await sendTelegramMessage(chatId,
            `<b>Welcome to VisionaryFit Bot!</b>\n\n` +
            `To connect your account:\n\n` +
            `1. Open VisionaryFit app\n` +
            `2. Go to Profile > Settings > Telegram\n` +
            `3. Enter this code: <code>${linkCode}</code>\n\n` +
            `This code expires in 10 minutes.`
          )
        }
        return NextResponse.json({ ok: true })
      }

      if (text === '/help') {
        await sendTelegramMessage(chatId,
          `<b>VisionaryFit Bot Commands</b>\n\n` +
          `/status - View today's progress\n` +
          `/water - Log water intake\n` +
          `/workout - View today's workout\n` +
          `/streak - Check your streak\n` +
          `/help - Show this message`
        )
        return NextResponse.json({ ok: true })
      }

      if (!telegramUser.length || !telegramUser[0].is_verified) {
        await sendTelegramMessage(chatId,
          `Please link your account first using /start`
        )
        return NextResponse.json({ ok: true })
      }

      const userId = telegramUser[0].user_id

      if (text === '/status') {
        const today = new Date().toISOString().split('T')[0]
        
        const stats = await sql`
          SELECT 
            (SELECT COUNT(*) FROM workout_sessions WHERE user_id = ${userId} AND DATE(started_at) = ${today} AND completed_at IS NOT NULL) as workouts_today,
            (SELECT current_streak FROM user_streaks WHERE user_id = ${userId}) as streak,
            (SELECT water_intake FROM daily_logs WHERE user_id = ${userId} AND DATE(log_date) = ${today}) as water
        `
        const s = stats[0] || {}

        await sendTelegramMessage(chatId,
          `<b>Today's Progress</b>\n\n` +
          `Workouts: ${s.workouts_today || 0}\n` +
          `Water: ${s.water || 0} glasses\n` +
          `Streak: ${s.streak || 0} days`
        )
      }

      if (text === '/water') {
        const today = new Date().toISOString().split('T')[0]
        
        await sql`
          INSERT INTO daily_logs (user_id, log_date, water_intake)
          VALUES (${userId}, ${today}, 1)
          ON CONFLICT (user_id, log_date)
          DO UPDATE SET water_intake = daily_logs.water_intake + 1
        `

        const current = await sql`
          SELECT water_intake FROM daily_logs WHERE user_id = ${userId} AND DATE(log_date) = ${today}
        `

        await sendTelegramMessage(chatId,
          `Water logged! You've had ${current[0]?.water_intake || 1} glasses today.`
        )
      }

      if (text === '/streak') {
        const streak = await sql`
          SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = ${userId}
        `
        const s = streak[0] || { current_streak: 0, longest_streak: 0 }

        await sendTelegramMessage(chatId,
          `<b>Your Streak</b>\n\n` +
          `Current: ${s.current_streak} days\n` +
          `Longest: ${s.longest_streak} days\n\n` +
          `Keep it going!`
        )
      }
    }

    // Handle callback queries (button presses)
    if (update.callback_query) {
      const callbackData = update.callback_query.data
      const chatId = update.callback_query.message.chat.id.toString()

      const telegramUser = await sql`
        SELECT * FROM telegram_users WHERE telegram_chat_id = ${chatId} AND is_verified = true
      `

      if (telegramUser.length > 0) {
        const userId = telegramUser[0].user_id

        if (callbackData === 'log_water') {
          const today = new Date().toISOString().split('T')[0]
          
          await sql`
            INSERT INTO daily_logs (user_id, log_date, water_intake)
            VALUES (${userId}, ${today}, 1)
            ON CONFLICT (user_id, log_date)
            DO UPDATE SET water_intake = daily_logs.water_intake + 1
          `

          await sendTelegramMessage(chatId, 'Water logged!')
        }

        if (callbackData === 'start_workout') {
          await sendTelegramMessage(chatId, 
            'Great! Open the VisionaryFit app to start your workout.'
          )
        }

        if (callbackData === 'skip_workout') {
          await sendTelegramMessage(chatId, 
            'No problem! Rest is important too. See you tomorrow!'
          )
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}
