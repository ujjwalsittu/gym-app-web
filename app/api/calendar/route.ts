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
        ws.start_time,
        ws.end_time,
        ws.status,
        ws.gym_verified,
        ws.total_exercises,
        ws.total_sets,
        ws.calories_burned,
        wp.name as workout_name,
        wp.day_of_week
      FROM workout_sessions ws
      LEFT JOIN workout_plans wp ON ws.workout_plan_id = wp.id
      WHERE ws.user_id = ${user.id}
        AND ws.start_time >= ${startDate.toISOString()}
        AND ws.start_time <= ${endDate.toISOString()}
      ORDER BY ws.start_time ASC
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
        gymVerified: boolean
        duration: number
        calories: number
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
      const dateStr = new Date(session.start_time).toISOString().split('T')[0]
      if (calendarDays[dateStr]) {
        const duration = session.end_time 
          ? Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)
          : 0
        
        calendarDays[dateStr].hasWorkout = true
        calendarDays[dateStr].session = {
          id: session.id,
          status: session.status,
          gymVerified: session.gym_verified,
          duration,
          calories: session.calories_burned || 0,
          exercises: session.total_exercises || 0
        }
      }
    }

    // Calculate monthly stats
    const completedWorkouts = sessions.filter((s: { status: string }) => s.status === 'completed').length
    const totalCalories = sessions.reduce((sum: number, s: { calories_burned: number }) => sum + (s.calories_burned || 0), 0)
    const totalMinutes = sessions.reduce((sum: number, s: { start_time: string, end_time: string }) => {
      if (s.end_time) {
        return sum + Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000)
      }
      return sum
    }, 0)

    return NextResponse.json({
      year,
      month,
      days: Object.values(calendarDays),
      stats: {
        completedWorkouts,
        totalCalories,
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
