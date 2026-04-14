import { cron } from '@vercel/workflow'
import { NextRequest, NextResponse } from 'next/server'

export default async function handler(req: NextRequest) {
  // Only allow POST requests from Vercel Cron
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  // Verify authorization header
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call the reminder sending function
    const response = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/reminders/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Reminders sent successfully',
      details: data
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({
      error: 'Failed to send reminders',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
