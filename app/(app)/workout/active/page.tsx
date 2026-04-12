'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Dumbbell, Clock, Check, ArrowLeft, ArrowRight, 
  Pause, Play, RotateCcw, X, Timer
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { ExerciseAnimation } from '@/components/workout/exercise-animation'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Exercise {
  name: string
  sets: number
  reps: string
  restSeconds: number
  notes: string | null
}

interface SetLog {
  setNumber: number
  repsCompleted: number
  weightUsed: number | null
  completed: boolean
}

export default function ActiveWorkoutPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const { data: dashboardData, isLoading: dashboardLoading } = useSWR(
    user ? '/api/dashboard' : null,
    fetcher
  )
  
  const { data: workoutData, isLoading: workoutLoading, mutate } = useSWR(
    user ? '/api/workout' : null,
    fetcher
  )

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [repsInput, setRepsInput] = useState(0)
  const [weightInput, setWeightInput] = useState<number | null>(null)
  const [isResting, setIsResting] = useState(false)
  const [restTime, setRestTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [setLogs, setSetLogs] = useState<Record<string, SetLog[]>>({})
  const [saving, setSaving] = useState(false)

  // Get today's plan
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todayPlan = dashboardData?.workoutPlan?.plan?.find(
    (day: { day: string }) => day.day.toLowerCase() === currentDay.toLowerCase()
  )
  const exercises: Exercise[] = todayPlan?.exercises || []
  const currentExercise = exercises[currentExerciseIndex]

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Rest timer effect
  useEffect(() => {
    if (isResting && restTime > 0) {
      const timer = setTimeout(() => {
        setRestTime(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (isResting && restTime === 0) {
      setIsResting(false)
    }
  }, [isResting, restTime])

  // Initialize reps input when exercise changes
  useEffect(() => {
    if (currentExercise) {
      const targetReps = parseInt(currentExercise.reps) || 12
      setRepsInput(targetReps)
    }
  }, [currentExercise])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const logSet = async () => {
    if (!workoutData?.session || !currentExercise) return

    setSaving(true)
    try {
      await fetch('/api/workout/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: workoutData.session.id,
          exerciseName: currentExercise.name,
          setNumber: currentSet,
          repsCompleted: repsInput,
          weightUsed: weightInput
        })
      })

      // Update local state
      const exerciseKey = currentExercise.name
      setSetLogs(prev => ({
        ...prev,
        [exerciseKey]: [
          ...(prev[exerciseKey] || []),
          { setNumber: currentSet, repsCompleted: repsInput, weightUsed: weightInput, completed: true }
        ]
      }))

      // Move to next set or exercise
      if (currentSet < currentExercise.sets) {
        setCurrentSet(prev => prev + 1)
        setIsResting(true)
        setRestTime(currentExercise.restSeconds)
      } else {
        // Exercise complete, move to next
        if (currentExerciseIndex < exercises.length - 1) {
          setCurrentExerciseIndex(prev => prev + 1)
          setCurrentSet(1)
          setIsResting(true)
          setRestTime(60) // Longer rest between exercises
        }
      }

      await mutate()
    } catch (error) {
      console.error('Failed to log set:', error)
    } finally {
      setSaving(false)
    }
  }

  const skipRest = () => {
    setIsResting(false)
    setRestTime(0)
  }

  const finishWorkout = async () => {
    if (!workoutData?.session) return

    setSaving(true)
    try {
      const caloriesBurned = Math.round((elapsedTime / 60) * 8) // Rough estimate

      await fetch('/api/workout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: workoutData.session.id,
          caloriesBurned
        })
      })

      router.push('/workout/complete')
    } catch (error) {
      console.error('Failed to finish workout:', error)
      setSaving(false)
    }
  }

  if (authLoading || dashboardLoading || workoutLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!workoutData?.session) {
    router.push('/workout/start')
    return null
  }

  if (!currentExercise) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Check className="h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-2xl font-bold">Workout Complete!</h1>
        <Button onClick={finishWorkout} className="mt-6" disabled={saving}>
          {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Finish & Save
        </Button>
      </div>
    )
  }

  const completedSets = setLogs[currentExercise.name]?.length || 0
  const progress = ((currentExerciseIndex + completedSets / currentExercise.sets) / exercises.length) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur p-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-mono text-xl">{formatTime(elapsedTime)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Progress value={progress} className="mt-3 h-2" />
      </header>

      {/* Rest Screen Overlay */}
      {isResting && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/95 backdrop-blur">
          <Timer className="h-16 w-16 text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Rest Time</p>
          <p className="mt-2 font-mono text-6xl font-bold">{restTime}</p>
          <p className="mt-2 text-muted-foreground">seconds</p>
          <Button onClick={skipRest} variant="outline" className="mt-8">
            Skip Rest
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-lg p-4 space-y-6">
        {/* Exercise Animation */}
        <div className="flex justify-center py-4">
          <ExerciseAnimation 
            exerciseName={currentExercise.name}
            autoplay={!isResting}
            showControls={true}
            size="md"
          />
        </div>

        {/* Exercise Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </p>
          <h1 className="text-2xl font-bold">{currentExercise.name}</h1>
          <p className="text-muted-foreground">
            Set {currentSet} of {currentExercise.sets}
          </p>
        </div>

        {/* Set Progress Indicators */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: currentExercise.sets }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-8 rounded-full transition-colors ${
                i < completedSets
                  ? 'bg-green-500'
                  : i === completedSets
                  ? 'bg-primary'
                  : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Input Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Reps Input */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Reps Completed</label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRepsInput(prev => Math.max(0, prev - 1))}
                >
                  <span className="text-xl">-</span>
                </Button>
                <span className="w-20 text-center text-4xl font-bold">{repsInput}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRepsInput(prev => prev + 1)}
                >
                  <span className="text-xl">+</span>
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Target: {currentExercise.reps}
              </p>
            </div>

            {/* Weight Input */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Weight (kg) - Optional</label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeightInput(prev => Math.max(0, (prev || 0) - 2.5))}
                >
                  <span className="text-xl">-</span>
                </Button>
                <span className="w-20 text-center text-4xl font-bold">
                  {weightInput ?? '-'}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeightInput(prev => (prev || 0) + 2.5)}
                >
                  <span className="text-xl">+</span>
                </Button>
              </div>
            </div>

            {/* Notes */}
            {currentExercise.notes && (
              <div className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
                <strong>Tip:</strong> {currentExercise.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              if (currentSet > 1) {
                setCurrentSet(prev => prev - 1)
              } else if (currentExerciseIndex > 0) {
                setCurrentExerciseIndex(prev => prev - 1)
                setCurrentSet(exercises[currentExerciseIndex - 1].sets)
              }
            }}
            disabled={currentExerciseIndex === 0 && currentSet === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button onClick={logSet} disabled={saving}>
            {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
            Done
          </Button>
        </div>

        {/* Finish Button */}
        <Button 
          variant="secondary" 
          className="w-full"
          onClick={finishWorkout}
          disabled={saving}
        >
          Finish Workout Early
        </Button>
      </main>
    </div>
  )
}
