'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, ArrowRight, ArrowLeft } from 'lucide-react'

const EQUIPMENT_OPTIONS = [
  { id: 'dumbbells', label: 'Dumbbells', icon: '🏋️' },
  { id: 'barbell', label: 'Barbell', icon: '📊' },
  { id: 'cable_machine', label: 'Cable Machine', icon: '🔗' },
  { id: 'resistance_bands', label: 'Resistance Bands', icon: '📏' },
  { id: 'kettlebell', label: 'Kettlebell', icon: '⚙️' },
  { id: 'medicine_ball', label: 'Medicine Ball', icon: '⚽' },
  { id: 'treadmill', label: 'Treadmill', icon: '🏃' },
  { id: 'exercise_bike', label: 'Exercise Bike', icon: '🚴' },
  { id: 'yoga_mat', label: 'Yoga Mat', icon: '🧘' },
  { id: 'pull_up_bar', label: 'Pull Up Bar', icon: '🤸' },
  { id: 'bench', label: 'Weight Bench', icon: '🪑' },
  { id: 'pull_down_machine', label: 'Pull Down Machine', icon: '⬇️' }
]

export function StepEquipment() {
  const { data, updateData, setStep } = useOnboardingStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleEquipment = (id: string) => {
    const current = data.equipmentAtHome || []
    const updated = current.includes(id)
      ? current.filter((e) => e !== id)
      : [...current, id]
    updateData({ equipmentAtHome: updated })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    // At least one equipment should be selected OR user has gym access
    if ((!data.equipmentAtHome || data.equipmentAtHome.length === 0) && !data.gymAccess) {
      newErrors.equipment = 'Please select equipment or enable gym access'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      setStep(10)
    }
  }

  const handleBack = () => {
    setStep(8)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Your Equipment</h2>
        <p className="text-muted-foreground">
          Select the equipment available to you. This helps us create workouts you can actually do.
        </p>
      </div>

      {data.gymAccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ You have gym access, so you&apos;ll have access to all equipment.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="h-5 w-5 text-primary" />
            Available Equipment
          </CardTitle>
          <CardDescription>
            Select all equipment you have access to at home or local gym.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {EQUIPMENT_OPTIONS.map((equipment) => (
              <button
                key={equipment.id}
                onClick={() => toggleEquipment(equipment.id)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  data.equipmentAtHome?.includes(equipment.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-2xl mb-2">{equipment.icon}</div>
                <div className="text-sm font-medium">{equipment.label}</div>
              </button>
            ))}
          </div>

          {data.equipmentAtHome && data.equipmentAtHome.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Selected:</p>
              <div className="flex flex-wrap gap-2">
                {data.equipmentAtHome.map((eq) => {
                  const equipment = EQUIPMENT_OPTIONS.find((e) => e.id === eq)
                  return (
                    <Badge key={eq} variant="secondary">
                      {equipment?.label}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {errors.equipment && (
            <p className="text-sm text-destructive mt-4">{errors.equipment}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
