const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function sendTelegramMessage(chatId: string, text: string, options?: {
  parseMode?: 'HTML' | 'Markdown'
  replyMarkup?: any
}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram bot token not configured')
    return null
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode || 'HTML',
        reply_markup: options?.replyMarkup
      })
    })

    return response.json()
  } catch (error) {
    console.error('Telegram send error:', error)
    return null
  }
}

export function createInlineKeyboard(buttons: { text: string; callbackData: string }[][]) {
  return {
    inline_keyboard: buttons.map(row => 
      row.map(btn => ({
        text: btn.text,
        callback_data: btn.callbackData
      }))
    )
  }
}

export async function sendWorkoutReminder(chatId: string, workoutName: string) {
  const keyboard = createInlineKeyboard([
    [
      { text: 'Start Workout', callbackData: 'start_workout' },
      { text: 'Skip Today', callbackData: 'skip_workout' }
    ]
  ])

  return sendTelegramMessage(
    chatId,
    `<b>Time to workout!</b>\n\nToday's workout: <b>${workoutName}</b>\n\nAre you ready to crush it?`,
    { replyMarkup: keyboard }
  )
}

export async function sendWaterReminder(chatId: string, currentGlasses: number, targetGlasses: number) {
  const keyboard = createInlineKeyboard([
    [
      { text: 'Log Water', callbackData: 'log_water' },
      { text: 'Skip', callbackData: 'skip_water' }
    ]
  ])

  return sendTelegramMessage(
    chatId,
    `<b>Stay Hydrated!</b>\n\nYou've had ${currentGlasses}/${targetGlasses} glasses today.\n\nTime for another glass of water!`,
    { replyMarkup: keyboard }
  )
}

export async function sendDailySummary(chatId: string, summary: {
  workoutsCompleted: number
  caloriesBurned: number
  waterGlasses: number
  currentStreak: number
}) {
  return sendTelegramMessage(
    chatId,
    `<b>Daily Summary</b>\n\n` +
    `Workouts: ${summary.workoutsCompleted}\n` +
    `Calories Burned: ${summary.caloriesBurned}\n` +
    `Water: ${summary.waterGlasses} glasses\n` +
    `Current Streak: ${summary.currentStreak} days\n\n` +
    `Keep up the great work!`
  )
}

export async function setWebhook(url: string) {
  if (!TELEGRAM_BOT_TOKEN) return null

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    return response.json()
  } catch (error) {
    console.error('Set webhook error:', error)
    return null
  }
}
