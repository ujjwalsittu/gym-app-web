import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Get all workout sessions for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const sessions = await sql`
      SELECT 
        ws.id,
        ws.started_at,
        ws.completed_at,
        ws.status,
        ws.notes
      FROM workout_sessions ws
      WHERE ws.user_id = ${user.id}
        AND ws.started_at >= ${startDate.toISOString()}
        AND ws.started_at <= ${endDate.toISOString()}
      ORDER BY ws.started_at ASC
    `

    // Get workout plan for scheduled days
    const workoutPlan = await sql`
      SELECT day_of_week, name, exercises
      FROM workout_plans
      WHERE user_id = ${user.id}
      ORDER BY day_of_week ASC
    `

    // Get user streak
    const streakResult = await sql`
      SELECT current_streak, longest_streak, last_workout_date
      FROM user_streaks
      WHERE user_id = ${user.id}
    `
    const streak = streakResult[0] || { current_streak: 0, longest_streak: 0 }

    // Build calendar data
    const calendarDays: Record<string, {
      date: string
      hasWorkout: boolean
      isScheduled: boolean
      isRestDay: boolean
      session?: {
        id: string
        status: string
        duration: number
        exercises: number
      }
      scheduledWorkout?: string
    }> = {}

    // Mark scheduled workout days
    const daysInMonth = new Date(year, month, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const dayOfWeek = date.getDay()
      const dateStr = date.toISOString().split('T')[0]
      
      const scheduledPlan = workoutPlan.find((p: { day_of_week: number }) => p.day_of_week === dayOfWeek)
      
      calendarDays[dateStr] = {
        date: dateStr,
        hasWorkout: false,
        isScheduled: !!scheduledPlan,
        isRestDay: !scheduledPlan,
        scheduledWorkout: scheduledPlan?.name
      }
    }

    // Mark completed workouts
    for (const session of sessions) {
      const dateStr = new Date(session.started_at).toISOString().split('T')[0]
      if (calendarDays[dateStr]) {
        const duration = session.completed_at 
          ? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)
          : 0
        
        calendarDays[dateStr].hasWorkout = true
        calendarDays[dateStr].session = {
          id: session.id,
          status: session.status,
          duration,
          exercises: 0
        }
      }
    }

    // Calculate monthly stats
    const completedWorkouts = sessions.filter((s: { status: string }) => s.status === 'completed').length
    const totalMinutes = sessions.reduce((sum: number, s: { started_at: string, completed_at: string }) => {
      if (s.completed_at) {
        return sum + Math.round((new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000)
      }
      return sum
    }, 0)

    return NextResponse.json({
      year,
      month,
      days: Object.values(calendarDays),
      stats: {
        completedWorkouts,
        totalMinutes,
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak
      },
      workoutPlan
    })
  } catch (error) {
    console.error('Calendar fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 })
  }
}
