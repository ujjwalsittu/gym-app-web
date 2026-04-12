'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Utensils, Droplets, Pill, ArrowLeft, ArrowRight, X } from 'lucide-react'

export function StepDiet() {
  const { data, updateData, setStep } = useOnboardingStore()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [supplementInput, setSupplementInput] = useState('')

  const dietTypes = [
    { value: 'omnivore', label: 'Omnivore', icon: '🍖' },
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
    { value: 'vegan', label: 'Vegan', icon: '🌱' },
    { value: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
    { value: 'keto', label: 'Keto', icon: '🥑' },
    { value: 'other', label: 'Other', icon: '🍽️' }
  ] as const

  const addSupplement = () => {
    if (supplementInput.trim() && !data.supplements.includes(supplementInput.trim())) {
      updateData({ supplements: [...data.supplements, supplementInput.trim()] })
      setSupplementInput('')
    }
  }

  const removeSupplement = (supplement: string) => {
    updateData({ supplements: data.supplements.filter(s => s !== supplement) })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!data.dietType) {
      newErrors.dietType = 'Please select your diet type'
    }
    if (!data.mealsPerDay) {
      newErrors.mealsPerDay = 'Please indicate meals per day'
    }
    if (!data.waterIntake) {
      newErrors.waterIntake = 'Please indicate your water intake'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      setStep(4)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Diet & Nutrition</h2>
        <p className="text-muted-foreground">
          Your eating habits help us create a personalized meal plan.
        </p>
      </div>

      {/* Diet Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Utensils className="h-5 w-5 text-primary" />
            Diet Type
          </CardTitle>
          <CardDescription>
            What is your primary dietary preference?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {dietTypes.map((diet) => (
              <button
                key={diet.value}
                type="button"
                onClick={() => updateData({ dietType: diet.value })}
                className={`rounded-lg border-2 p-3 text-center transition-all ${
                  data.dietType === diet.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-2xl">{diet.icon}</div>
                <div className="mt-1 text-sm font-medium">{diet.label}</div>
              </button>
            ))}
          </div>
          {errors.dietType && <p className="mt-2 text-sm text-destructive">{errors.dietType}</p>}
        </CardContent>
      </Card>

      {/* Meals Per Day */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meals Per Day</CardTitle>
          <CardDescription>
            How many meals do you typically eat?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Number of Meals</FieldLabel>
              <span className="text-2xl font-bold text-primary">{data.mealsPerDay || 3}</span>
            </div>
            <Slider
              value={[data.mealsPerDay || 3]}
              onValueChange={([value]) => updateData({ mealsPerDay: value })}
              min={1}
              max={6}
              step={1}
              className="mt-4"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>1 meal</span>
              <span>6 meals</span>
            </div>
          </Field>
          {errors.mealsPerDay && <p className="mt-2 text-sm text-destructive">{errors.mealsPerDay}</p>}
        </CardContent>
      </Card>

      {/* Water Intake */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Droplets className="h-5 w-5 text-primary" />
            Water Intake
          </CardTitle>
          <CardDescription>
            How many glasses of water do you drink daily?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Glasses per Day</FieldLabel>
              <span className="text-2xl font-bold text-primary">{data.waterIntake || 8}</span>
            </div>
            <Slider
              value={[data.waterIntake || 8]}
              onValueChange={([value]) => updateData({ waterIntake: value })}
              min={1}
              max={15}
              step={1}
              className="mt-4"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>1 glass</span>
              <span>15 glasses</span>
            </div>
          </Field>
          {errors.waterIntake && <p className="mt-2 text-sm text-destructive">{errors.waterIntake}</p>}
        </CardContent>
      </Card>

      {/* Supplements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="h-5 w-5 text-primary" />
            Supplements
          </CardTitle>
          <CardDescription>
            Any supplements you currently take (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Protein, Creatine, Vitamin D"
              value={supplementInput}
              onChange={(e) => setSupplementInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSupplement())}
            />
            <Button type="button" variant="secondary" onClick={addSupplement}>
              Add
            </Button>
          </div>
          {data.supplements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.supplements.map((supplement) => (
                <Badge key={supplement} variant="secondary" className="gap-1 pr-1">
                  {supplement}
                  <button
                    type="button"
                    onClick={() => removeSupplement(supplement)}
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

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
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
