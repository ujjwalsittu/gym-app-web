'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { User, Ruler, Scale, ArrowRight } from 'lucide-react'

export function StepPersonalInfo() {
  const { data, updateData, setStep } = useOnboardingStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ] as const

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!data.age || data.age < 13 || data.age > 100) {
      newErrors.age = 'Please enter a valid age (13-100)'
    }
    if (!data.gender) {
      newErrors.gender = 'Please select your gender'
    }
    if (!data.height || data.height < 100 || data.height > 250) {
      newErrors.height = 'Please enter a valid height (100-250 cm)'
    }
    if (!data.weight || data.weight < 30 || data.weight > 300) {
      newErrors.weight = 'Please enter a valid weight (30-300 kg)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      setStep(2)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Personal Information</h2>
        <p className="text-muted-foreground">
          Let&apos;s start with some basic info to personalize your fitness plan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            About You
          </CardTitle>
          <CardDescription>
            This helps us calculate your metabolic rate and tailor recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="age">Age</FieldLabel>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={data.age || ''}
                onChange={(e) => updateData({ age: parseInt(e.target.value) || null })}
                min={13}
                max={100}
              />
              {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
            </Field>

            <Field>
              <FieldLabel>Gender</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {genderOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateData({ gender: option.value })}
                    className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                      data.gender === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="height">
                <span className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Height (cm)
                </span>
              </FieldLabel>
              <Input
                id="height"
                type="number"
                placeholder="175"
                value={data.height || ''}
                onChange={(e) => updateData({ height: parseInt(e.target.value) || null })}
                min={100}
                max={250}
              />
              {errors.height && <p className="text-sm text-destructive">{errors.height}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="weight">
                <span className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Weight (kg)
                </span>
              </FieldLabel>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={data.weight || ''}
                onChange={(e) => updateData({ weight: parseInt(e.target.value) || null })}
                min={30}
                max={300}
              />
              {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Button onClick={handleNext} className="w-full" size="lg">
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
