'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { DashboardHeader } from '@/components/dashboard/header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TodayWorkout } from '@/components/dashboard/today-workout'
import { WeeklyPlan } from '@/components/dashboard/weekly-plan'
import { DietOverview } from '@/components/dashboard/diet-overview'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import { Spinner } from '@/components/ui/spinner'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const { data, error, isLoading, mutate } = useSWR(
    user ? '/api/dashboard' : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p className="text-destructive">Failed to load dashboard</p>
        <button 
          onClick={() => mutate()}
          className="mt-4 text-primary underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!data || !user) {
    return null
  }

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todayPlan = data.workoutPlan?.plan?.find(
    (day: { day: string }) => day.day.toLowerCase() === currentDay.toLowerCase()
  )

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <DashboardHeader user={data.user} />

      {/* Main Content */}
      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {/* Stats Overview */}
        <StatsCards 
          weeklyStats={data.weeklyStats}
          profile={data.profile}
        />

        {/* Quick Actions */}
        <QuickActions 
          hasActiveSession={!!data.todaySession}
          todayPlan={todayPlan}
        />

        {/* Today's Workout */}
        {todayPlan && (
          <TodayWorkout 
            plan={todayPlan}
            session={data.todaySession}
            exercises={data.todayExercises}
          />
        )}

        {/* Weekly Plan Overview */}
        {data.workoutPlan && (
          <WeeklyPlan 
            plan={data.workoutPlan.plan}
            currentDay={currentDay}
          />
        )}

        {/* Diet Overview */}
        {data.dietPlan && (
          <DietOverview dietPlan={data.dietPlan} />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
