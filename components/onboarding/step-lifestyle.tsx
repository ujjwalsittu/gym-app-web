'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Slider } from '@/components/ui/slider'
import { Activity, Moon, Briefcase, Brain, ArrowLeft, ArrowRight } from 'lucide-react'

export function StepLifestyle() {
  const { data, updateData, setStep } = useOnboardingStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { value: 'light', label: 'Light', description: '1-2 days/week' },
    { value: 'moderate', label: 'Moderate', description: '3-4 days/week' },
    { value: 'active', label: 'Active', description: '5-6 days/week' },
    { value: 'very_active', label: 'Very Active', description: 'Daily intense exercise' }
  ] as const

  const occupations = [
    { value: 'desk_job', label: 'Desk Job', icon: '💻' },
    { value: 'standing_job', label: 'Standing Job', icon: '🧍' },
    { value: 'physical_job', label: 'Physical Job', icon: '🔨' },
    { value: 'student', label: 'Student', icon: '📚' },
    { value: 'other', label: 'Other', icon: '🏠' }
  ] as const

  const stressLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'moderate', label: 'Moderate', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'very_high', label: 'Very High', color: 'bg-red-500' }
  ] as const

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!data.activityLevel) {
      newErrors.activityLevel = 'Please select your activity level'
    }
    if (!data.sleepHours) {
      newErrors.sleepHours = 'Please indicate your sleep hours'
    }
    if (!data.occupation) {
      newErrors.occupation = 'Please select your occupation type'
    }
    if (!data.stressLevel) {
      newErrors.stressLevel = 'Please select your stress level'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      setStep(3)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Lifestyle</h2>
        <p className="text-muted-foreground">
          Understanding your daily routine helps us optimize your plan.
        </p>
      </div>

      {/* Activity Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Activity Level
          </CardTitle>
          <CardDescription>
            How active are you in a typical week?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activityLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => updateData({ activityLevel: level.value })}
                className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                  data.activityLevel === level.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium">{level.label}</div>
                <div className="text-sm text-muted-foreground">{level.description}</div>
              </button>
            ))}
          </div>
          {errors.activityLevel && <p className="mt-2 text-sm text-destructive">{errors.activityLevel}</p>}
        </CardContent>
      </Card>

      {/* Sleep */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Moon className="h-5 w-5 text-primary" />
            Sleep
          </CardTitle>
          <CardDescription>
            How many hours do you sleep per night?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Hours of Sleep</FieldLabel>
              <span className="text-2xl font-bold text-primary">{data.sleepHours || 7}h</span>
            </div>
            <Slider
              value={[data.sleepHours || 7]}
              onValueChange={([value]) => updateData({ sleepHours: value })}
              min={4}
              max={12}
              step={0.5}
              className="mt-4"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>4h</span>
              <span>12h</span>
            </div>
          </Field>
          {errors.sleepHours && <p className="mt-2 text-sm text-destructive">{errors.sleepHours}</p>}
        </CardContent>
      </Card>

      {/* Occupation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-primary" />
            Occupation Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {occupations.map((occ) => (
              <button
                key={occ.value}
                type="button"
                onClick={() => updateData({ occupation: occ.value })}
                className={`rounded-lg border-2 p-3 text-center transition-all ${
                  data.occupation === occ.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-2xl">{occ.icon}</div>
                <div className="mt-1 text-sm font-medium">{occ.label}</div>
              </button>
            ))}
          </div>
          {errors.occupation && <p className="mt-2 text-sm text-destructive">{errors.occupation}</p>}
        </CardContent>
      </Card>

      {/* Stress Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Stress Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {stressLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => updateData({ stressLevel: level.value })}
                className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                  data.stressLevel === level.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`h-3 w-3 rounded-full ${level.color}`} />
                <span className="text-sm font-medium">{level.label}</span>
              </button>
            ))}
          </div>
          {errors.stressLevel && <p className="mt-2 text-sm text-destructive">{errors.stressLevel}</p>}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
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
