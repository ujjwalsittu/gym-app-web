'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader2, CheckCircle, AlertTriangle, Zap, Clock, Repeat2 } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  category: string
  equipment: string
  sets: number
  reps: string
  restSeconds: number
  instructions: string[]
  tips: string[]
  difficulty: string
}

interface WorkoutDay {
  dayOfWeek: number
  dayName: string
  focus: string
  warmup: { exercise: string; duration: string; instructions: string[] }
  exercises: Exercise[]
  cooldown: { exercise: string; duration: string; instructions: string[] }
  notes: string
}

interface WorkoutPlan {
  planName: string
  daysPerWeek: number
  skipDays: number[]
  workoutDays: WorkoutDay[]
}

export default function WorkoutPlanPage() {
  const { user } = useAuth()
  const [phase, setPhase] = useState<'input' | 'generating' | 'view'>('input')
  const [planName, setPlanName] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [skipDays, setSkipDays] = useState<number[]>([5, 6])
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null)
  const [error, setError] = useState('')
  const [selectedDay, setSelectedDay] = useState(0)

  const { data: existingPlan } = useSWR('/api/workout-plans/view', (url) =>
    fetch(url).then((res) => res.json()).catch(() => null)
  )

  useEffect(() => {
    if (existingPlan?.workoutPlan) {
      setCurrentPlan(existingPlan.workoutPlan)
      setPhase('view')
      setSelectedDay(0)
    }
  }, [existingPlan])

  const toggleSkipDay = (day: number) => {
    setSkipDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleGeneratePlan = async () => {
    if (!planName.trim()) {
      setError('Please enter a plan name')
      return
    }

    const workoutDaysCount = 7 - skipDays.length
    if (workoutDaysCount !== daysPerWeek) {
      setError(`You have ${workoutDaysCount} workout days but selected ${daysPerWeek}`)
      return
    }

    setError('')
    setPhase('generating')

    try {
      const response = await fetch('/api/workout-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          daysPerWeek,
          skipDays,
          goal: user?.goal || 'General fitness'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate plan')
        setPhase('input')
        return
      }

      setCurrentPlan(data.workoutPlan)
      setPhase('view')
      setSelectedDay(0)
    } catch (err) {
      setError('Network error. Please try again.')
      setPhase('input')
    }
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (phase === 'input' && !currentPlan) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
        <div>
          <h1 className="text-3xl font-bold">Create Workout Plan</h1>
          <p className="text-muted-foreground">AI-powered personalized training program</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
            <CardDescription>Set up your personalized workout plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Name</label>
              <Input
                placeholder="e.g., Summer Shred 2024"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Days Per Week</label>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map((n) => (
                  <Button
                    key={n}
                    variant={daysPerWeek === n ? 'default' : 'outline'}
                    onClick={() => setDaysPerWeek(n)}
                  >
                    {n} days
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Select Days to Skip</label>
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day, idx) => (
                  <Button
                    key={idx}
                    variant={skipDays.includes(idx) ? 'destructive' : 'outline'}
                    onClick={() => toggleSkipDay(idx)}
                    className="w-full"
                    size="sm"
                  >
                    {day}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {7 - skipDays.length} workout days selected
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button onClick={handleGeneratePlan} size="lg" className="w-full">
              Generate AI Workout Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (phase === 'generating') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">Generating your personalized workout plan...</p>
          <p className="text-sm text-muted-foreground">Our AI is creating a customized program based on your profile and exercise database</p>
        </div>
      </div>
    )
  }

  if (!currentPlan) {
    return null
  }

  const workoutDay = currentPlan.workoutDays[selectedDay]

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-8 px-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{currentPlan.planName}</h1>
          <p className="text-muted-foreground">{currentPlan.daysPerWeek} days/week • {currentPlan.workoutDays.length} workouts</p>
        </div>
        <Button variant="outline" onClick={() => { setPhase('input'); setCurrentPlan(null) }}>
          Create New Plan
        </Button>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, idx) => {
              const isWorkoutDay = !currentPlan.skipDays.includes(idx)
              const dayWorkoutIdx = currentPlan.workoutDays.findIndex((d) => d.dayOfWeek === idx)

              return (
                <button
                  key={idx}
                  onClick={() => isWorkoutDay && setSelectedDay(dayWorkoutIdx)}
                  disabled={!isWorkoutDay}
                  className={`p-3 rounded-lg border text-center transition ${
                    isWorkoutDay
                      ? selectedDay === dayWorkoutIdx
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted border-border hover:bg-muted/80 cursor-pointer'
                      : 'bg-muted/30 border-dashed opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="font-semibold text-sm">{dayNames[idx]}</div>
                  <div className="text-xs mt-1">
                    {isWorkoutDay ? `${currentPlan.workoutDays[dayWorkoutIdx]?.exercises.length || 0} ex` : 'Rest'}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Workout Details */}
      {workoutDay && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{workoutDay.dayName} - {workoutDay.focus}</CardTitle>
              <CardDescription>{workoutDay.exercises.length} exercises planned</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Warmup */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Warmup: {workoutDay.warmup.exercise}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-blue-800 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {workoutDay.warmup.duration}
                  </span>
                </div>
                <ul className="space-y-1 text-sm text-blue-900 list-disc list-inside">
                  {workoutDay.warmup.instructions.map((instruction, idx) => (
                    <li key={idx}>{instruction}</li>
                  ))}
                </ul>
              </div>

              {/* Main Exercises */}
              <div className="space-y-4">
                {workoutDay.exercises.map((exercise, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{idx + 1}. {exercise.name}</CardTitle>
                          <CardDescription>
                            <div className="flex gap-2 flex-wrap mt-2">
                              <Badge variant="outline">{exercise.category}</Badge>
                              <Badge variant="outline">{exercise.equipment}</Badge>
                              <Badge variant="outline" className="capitalize">{exercise.difficulty}</Badge>
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Workout Metrics */}
                      <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Sets</div>
                          <div className="text-2xl font-bold">{exercise.sets}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Reps</div>
                          <div className="text-2xl font-bold">{exercise.reps}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Rest</div>
                          <div className="text-2xl font-bold">{exercise.restSeconds}s</div>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Form Instructions
                        </h4>
                        <ol className="space-y-2 text-sm">
                          {exercise.instructions.map((instruction, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="font-semibold text-muted-foreground min-w-fit">{i + 1}.</span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Safety Tips */}
                      {exercise.tips && exercise.tips.length > 0 && (
                        <div className="border-t pt-3">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Pro Tips & Safety
                          </h4>
                          <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
                            {exercise.tips.map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Cooldown */}
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Cooldown: {workoutDay.cooldown.exercise}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-green-800 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {workoutDay.cooldown.duration}
                  </span>
                </div>
                <ul className="space-y-1 text-sm text-green-900 list-disc list-inside">
                  {workoutDay.cooldown.instructions.map((instruction, idx) => (
                    <li key={idx}>{instruction}</li>
                  ))}
                </ul>
              </div>

              {/* Daily Notes */}
              {workoutDay.notes && (
                <div className="border-l-4 border-primary bg-primary/5 p-4 rounded">
                  <p className="text-sm"><strong>Today's Focus:</strong> {workoutDay.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
