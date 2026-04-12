'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dumbbell, Clock, Flame, Check } from 'lucide-react'

interface Exercise {
  name: string
  sets: number
  reps: string
  restSeconds: number
  notes: string | null
}

interface TodayWorkoutProps {
  plan: {
    name: string
    focus: string
    exercises: Exercise[]
    durationMinutes: number
    caloriesBurn: number
  }
  session: {
    id: string
    started_at: string
    completed_at: string | null
  } | null
  exercises: Array<{
    exercise_name: string
    completed: boolean
  }>
}

export function TodayWorkout({ plan, session, exercises }: TodayWorkoutProps) {
  const completedCount = exercises.filter(e => e.completed).length
  const totalExercises = plan.exercises.length
  const progress = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="h-5 w-5 text-primary" />
            {"Today's Workout"}
          </CardTitle>
          <Badge variant={session?.completed_at ? 'default' : 'secondary'}>
            {session?.completed_at ? 'Completed' : session ? 'In Progress' : 'Not Started'}
          </Badge>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {plan.durationMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-4 w-4" />
            ~{plan.caloriesBurn} kcal
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {session && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{completedCount}/{totalExercises} exercises</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Exercise List */}
        <div className="space-y-2">
          {plan.exercises.slice(0, 5).map((exercise, index) => {
            const isCompleted = exercises.some(
              e => e.exercise_name === exercise.name && e.completed
            )
            return (
              <div
                key={index}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  isCompleted ? 'border-green-500/50 bg-green-500/10' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isCompleted ? 'bg-green-500 text-white' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets} sets x {exercise.reps}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          
          {plan.exercises.length > 5 && (
            <p className="text-center text-sm text-muted-foreground">
              +{plan.exercises.length - 5} more exercises
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
