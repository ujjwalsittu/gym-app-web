'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Cigarette, Wine, Coffee, ArrowLeft, ArrowRight } from 'lucide-react'

export function StepHabits() {
  const { data, updateData, setStep } = useOnboardingStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const smokingOptions = [
    { value: 'never', label: 'Never smoked', color: 'bg-green-500' },
    { value: 'former', label: 'Former smoker', color: 'bg-yellow-500' },
    { value: 'occasional', label: 'Occasional', color: 'bg-orange-500' },
    { value: 'regular', label: 'Regular', color: 'bg-red-500' }
  ] as const

  const alcoholOptions = [
    { value: 'never', label: 'Never', color: 'bg-green-500' },
    { value: 'occasional', label: 'Occasional (1-2/month)', color: 'bg-yellow-500' },
    { value: 'moderate', label: 'Moderate (1-2/week)', color: 'bg-orange-500' },
    { value: 'frequent', label: 'Frequent (3+/week)', color: 'bg-red-500' }
  ] as const

  const caffeineOptions = [
    { value: 'none', label: 'None', description: '0 cups' },
    { value: 'low', label: 'Low', description: '1-2 cups' },
    { value: 'moderate', label: 'Moderate', description: '3-4 cups' },
    { value: 'high', label: 'High', description: '5+ cups' }
  ] as const

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!data.smokingStatus) {
      newErrors.smokingStatus = 'Please select your smoking status'
    }
    if (!data.alcoholConsumption) {
      newErrors.alcoholConsumption = 'Please select your alcohol consumption'
    }
    if (!data.caffeineIntake) {
      newErrors.caffeineIntake = 'Please select your caffeine intake'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      setStep(5)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Habits</h2>
        <p className="text-muted-foreground">
          Your habits affect recovery and results. Be honest for accurate recommendations.
        </p>
      </div>

      {/* Smoking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cigarette className="h-5 w-5 text-primary" />
            Smoking
          </CardTitle>
          <CardDescription>
            What is your smoking status?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {smokingOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateData({ smokingStatus: option.value })}
                className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                  data.smokingStatus === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`h-3 w-3 rounded-full ${option.color}`} />
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          {errors.smokingStatus && <p className="mt-2 text-sm text-destructive">{errors.smokingStatus}</p>}
        </CardContent>
      </Card>

      {/* Alcohol */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wine className="h-5 w-5 text-primary" />
            Alcohol
          </CardTitle>
          <CardDescription>
            How often do you consume alcohol?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alcoholOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateData({ alcoholConsumption: option.value })}
                className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                  data.alcoholConsumption === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`h-3 w-3 rounded-full ${option.color}`} />
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          {errors.alcoholConsumption && <p className="mt-2 text-sm text-destructive">{errors.alcoholConsumption}</p>}
        </CardContent>
      </Card>

      {/* Caffeine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coffee className="h-5 w-5 text-primary" />
            Caffeine
          </CardTitle>
          <CardDescription>
            Daily coffee/tea consumption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {caffeineOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateData({ caffeineIntake: option.value })}
                className={`rounded-lg border-2 p-3 text-center transition-all ${
                  data.caffeineIntake === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </button>
            ))}
          </div>
          {errors.caffeineIntake && <p className="mt-2 text-sm text-destructive">{errors.caffeineIntake}</p>}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
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
