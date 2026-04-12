'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, Clock, Flame, ArrowLeft, Play, Check } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Exercise {
  name: string
  sets: number
  reps: string
  restSeconds: number
  notes: string | null
}

interface DayPlan {
  day: string
  name: string
  focus: string
  exercises: Exercise[]
  durationMinutes: number
  caloriesBurn: number
}

export default function WorkoutStartPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [starting, setStarting] = useState(false)
  
  const { data, isLoading } = useSWR(
    user ? '/api/dashboard' : null,
    fetcher
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

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todayPlan: DayPlan | null = data?.workoutPlan?.plan?.find(
    (day: DayPlan) => day.day.toLowerCase() === currentDay.toLowerCase()
  ) || null

  const startWorkout = async () => {
    setStarting(true)
    try {
      const response = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: data?.workoutPlan?.id,
          workoutDay: currentDay
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start workout')
      }

      router.push('/workout/active')
    } catch (error) {
      console.error('Start workout error:', error)
      setStarting(false)
    }
  }

  if (!todayPlan) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="mt-8 text-center">
          <Dumbbell className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Rest Day</h1>
          <p className="mt-2 text-muted-foreground">
            {"Today is a rest day. Recover and come back stronger!"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="text-sm text-muted-foreground">{currentDay}</span>
      </div>

      {/* Workout Info */}
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{todayPlan.name}</h1>
          <p className="text-muted-foreground">{todayPlan.focus}</p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>{todayPlan.durationMinutes} min</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="h-5 w-5" />
            <span>~{todayPlan.caloriesBurn} kcal</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Dumbbell className="h-5 w-5" />
            <span>{todayPlan.exercises.length} exercises</span>
          </div>
        </div>

        {/* Exercise List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exercises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayPlan.exercises.map((exercise, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets} sets x {exercise.reps}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {exercise.restSeconds}s rest
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button 
          onClick={startWorkout} 
          disabled={starting}
          size="lg" 
          className="w-full"
        >
          {starting ? (
            <Spinner className="mr-2 h-5 w-5" />
          ) : (
            <Play className="mr-2 h-5 w-5" />
          )}
          {starting ? 'Starting...' : 'Start Workout'}
        </Button>
      </div>
    </div>
  )
}
