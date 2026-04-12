'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Target, Calendar, Clock, Dumbbell, Home, ArrowLeft, ArrowRight, X } from 'lucide-react'

export function StepFitnessGoals() {
  const { data, updateData, setStep } = useOnboardingStore()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [equipmentInput, setEquipmentInput] = useState('')

  const goals = [
    { value: 'lose_weight', label: 'Lose Weight', icon: '⚖️', description: 'Burn fat and slim down' },
    { value: 'build_muscle', label: 'Build Muscle', icon: '💪', description: 'Gain strength and size' },
    { value: 'get_fit', label: 'Get Fit', icon: '🏃', description: 'Improve overall fitness' },
    { value: 'improve_health', label: 'Improve Health', icon: '❤️', description: 'Better heart and health' },
    { value: 'increase_strength', label: 'Increase Strength', icon: '🏋️', description: 'Lift heavier weights' },
    { value: 'improve_flexibility', label: 'Flexibility', icon: '🧘', description: 'Better mobility' }
  ] as const

  const addEquipment = () => {
    if (equipmentInput.trim() && !data.equipmentAtHome.includes(equipmentInput.trim())) {
      updateData({ equipmentAtHome: [...data.equipmentAtHome, equipmentInput.trim()] })
      setEquipmentInput('')
    }
  }

  const removeEquipment = (equipment: string) => {
    updateData({ equipmentAtHome: data.equipmentAtHome.filter(e => e !== equipment) })
  }

  const quickEquipment = ['Dumbbells', 'Resistance Bands', 'Pull-up Bar', 'Yoga Mat', 'Kettlebell', 'Bench']

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!data.primaryGoal) {
      newErrors.primaryGoal = 'Please select your primary goal'
    }
    if (!data.workoutDaysPerWeek) {
      newErrors.workoutDaysPerWeek = 'Please indicate workout days per week'
    }
    if (!data.workoutDuration) {
      newErrors.workoutDuration = 'Please indicate workout duration'
    }
    if (data.gymAccess === null) {
      newErrors.gymAccess = 'Please indicate gym access'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      setStep(6)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Fitness Goals</h2>
        <p className="text-muted-foreground">
          What do you want to achieve? We&apos;ll build your plan around this.
        </p>
      </div>

      {/* Primary Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Primary Goal
          </CardTitle>
          <CardDescription>
            Select your main fitness objective
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {goals.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => updateData({ primaryGoal: goal.value })}
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  data.primaryGoal === goal.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-xl">{goal.icon}</div>
                <div className="mt-1 text-sm font-medium">{goal.label}</div>
                <div className="text-xs text-muted-foreground">{goal.description}</div>
              </button>
            ))}
          </div>
          {errors.primaryGoal && <p className="mt-2 text-sm text-destructive">{errors.primaryGoal}</p>}
        </CardContent>
      </Card>

      {/* Target Weight (if losing/gaining) */}
      {(data.primaryGoal === 'lose_weight' || data.primaryGoal === 'build_muscle') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target Weight</CardTitle>
            <CardDescription>
              What is your goal weight? (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="targetWeight">Target Weight (kg)</FieldLabel>
              <Input
                id="targetWeight"
                type="number"
                placeholder={data.weight ? String(data.weight) : '70'}
                value={data.targetWeight || ''}
                onChange={(e) => updateData({ targetWeight: parseInt(e.target.value) || null })}
                min={30}
                max={200}
              />
            </Field>
          </CardContent>
        </Card>
      )}

      {/* Workout Days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Workout Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Days per Week</FieldLabel>
              <span className="text-2xl font-bold text-primary">{data.workoutDaysPerWeek || 4}</span>
            </div>
            <Slider
              value={[data.workoutDaysPerWeek || 4]}
              onValueChange={([value]) => updateData({ workoutDaysPerWeek: value })}
              min={1}
              max={7}
              step={1}
              className="mt-4"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>1 day</span>
              <span>7 days</span>
            </div>
          </Field>
          {errors.workoutDaysPerWeek && <p className="mt-2 text-sm text-destructive">{errors.workoutDaysPerWeek}</p>}
        </CardContent>
      </Card>

      {/* Workout Duration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Workout Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Minutes per Session</FieldLabel>
              <span className="text-2xl font-bold text-primary">{data.workoutDuration || 45} min</span>
            </div>
            <Slider
              value={[data.workoutDuration || 45]}
              onValueChange={([value]) => updateData({ workoutDuration: value })}
              min={15}
              max={120}
              step={15}
              className="mt-4"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>15 min</span>
              <span>120 min</span>
            </div>
          </Field>
          {errors.workoutDuration && <p className="mt-2 text-sm text-destructive">{errors.workoutDuration}</p>}
        </CardContent>
      </Card>

      {/* Gym Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="h-5 w-5 text-primary" />
            Gym Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateData({ gymAccess: true })}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                data.gymAccess === true
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Dumbbell className="h-8 w-8" />
              <span className="font-medium">Yes, I have gym access</span>
            </button>
            <button
              type="button"
              onClick={() => updateData({ gymAccess: false })}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                data.gymAccess === false
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Home className="h-8 w-8" />
              <span className="font-medium">Home workouts only</span>
            </button>
          </div>
          {errors.gymAccess && <p className="mt-2 text-sm text-destructive">{errors.gymAccess}</p>}
        </CardContent>
      </Card>

      {/* Home Equipment (if no gym) */}
      {data.gymAccess === false && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Home Equipment</CardTitle>
            <CardDescription>
              What equipment do you have at home?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {quickEquipment.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => {
                    if (data.equipmentAtHome.includes(eq)) {
                      removeEquipment(eq)
                    } else {
                      updateData({ equipmentAtHome: [...data.equipmentAtHome, eq] })
                    }
                  }}
                  className={`rounded-full border px-3 py-1 text-sm transition-all ${
                    data.equipmentAtHome.includes(eq)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add other equipment..."
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
              />
              <Button type="button" variant="secondary" onClick={addEquipment}>
                Add
              </Button>
            </div>
            {data.equipmentAtHome.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.equipmentAtHome.filter(e => !quickEquipment.includes(e)).map((equipment) => (
                  <Badge key={equipment} variant="secondary" className="gap-1 pr-1">
                    {equipment}
                    <button
                      type="button"
                      onClick={() => removeEquipment(equipment)}
                      className="ml-1 rounded-full p-0.5 hover:bg-background/50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
