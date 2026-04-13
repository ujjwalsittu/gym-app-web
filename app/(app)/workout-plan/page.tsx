'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ExerciseAnimation } from '@/components/workout/exercise-animation'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function WorkoutPlanPage() {
  const { user, loading } = useAuth()
  const [step, setStep] = useState('check') // check, input, view
  const [planName, setPlanName] = useState('My Workout Plan')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [skipDays, setSkipDays] = useState<number[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const { data: checkData, isLoading: checkLoading } = useSWR(
    user ? '/api/workout-plans/check' : null,
    (url) => fetch(url).then((res) => res.json())
  )

  useEffect(() => {
    if (checkLoading || loading) return

    if (checkData?.hasWorkoutPlan) {
      setStep('view')
    } else if (checkData?.missingFields?.length > 0) {
      setError(`Missing fields: ${checkData.missingFields.join(', ')}`)
      setStep('input')
    } else {
      setStep('input')
    }
  }, [checkData, checkLoading, loading])

  const handleDayToggle = (day: number) => {
    setSkipDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleGeneratePlan = async () => {
    if (skipDays.length >= 7) {
      setError('You must have at least 1 workout day')
      return
    }

    const actualWorkoutDays = 7 - skipDays.length
    if (actualWorkoutDays < daysPerWeek) {
      setError(`You cannot have ${daysPerWeek} workout days if you're skipping ${skipDays.length} days`)
      return
    }

    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/workout-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          daysPerWeek,
          skipDays,
          goal: checkData?.userProfile?.goal
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate workout plan')
        return
      }

      setStep('view')
    } catch (err) {
      setError('Error generating workout plan')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading || checkLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (step === 'input') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Generate Workout Plan</h1>
          <p className="text-muted-foreground">Create a personalized workout plan based on your profile</p>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Plan Name</label>
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g., Full Body Strength"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Days Per Week</label>
              <select
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {[1, 2, 3, 4, 5, 6].map((d) => (
                  <option key={d} value={d}>
                    {d} days per week
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Select Days to Skip (Choose {7 - daysPerWeek} days to skip)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDayToggle(idx)}
                    className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                      skipDays.includes(idx)
                        ? 'bg-red-500 text-white'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {skipDays.length}/{7 - daysPerWeek} days to skip selected
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={handleGeneratePlan}
            disabled={generating || skipDays.length !== 7 - daysPerWeek}
            className="flex-1"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Workout Plan'
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'view') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Workout Plan</h1>
            <p className="text-muted-foreground">Follow your personalized exercise routine</p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plan Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan Name</p>
                <p className="font-medium">{checkData?.workoutPlan?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Per Week</p>
                <p className="font-medium">{checkData?.workoutPlan?.days_per_week} days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(checkData?.workoutPlan?.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skip Days</p>
                <p className="font-medium">{DAYS_OF_WEEK.filter((_, i) => JSON.parse(checkData?.workoutPlan?.skip_days || '[]').includes(i)).join(', ')}</p>
              </div>
            </div>

            <Button onClick={() => setStep('input')} variant="outline" className="w-full">
              Generate New Plan
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DAYS_OF_WEEK.map((day, idx) => (
            !JSON.parse(checkData?.workoutPlan?.skip_days || '[]').includes(idx) && (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{day}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Workout exercises loading...</p>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      </div>
    )
  }

  return null
}
