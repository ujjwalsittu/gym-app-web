'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, AlertTriangle, Pill, Apple, ArrowLeft, ArrowRight, X } from 'lucide-react'

export function StepMedical() {
  const { data, updateData, setStep } = useOnboardingStore()
  
  const [conditionInput, setConditionInput] = useState('')
  const [injuryInput, setInjuryInput] = useState('')
  const [medicationInput, setMedicationInput] = useState('')
  const [allergyInput, setAllergyInput] = useState('')

  const commonConditions = ['Diabetes', 'High Blood Pressure', 'Asthma', 'Heart Condition', 'Thyroid Issue']
  const commonInjuries = ['Back Pain', 'Knee Injury', 'Shoulder Pain', 'Ankle Sprain', 'Wrist Issue']
  const commonAllergies = ['Peanuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy']

  const addItem = (field: 'medicalConditions' | 'injuries' | 'medications' | 'allergies', value: string) => {
    if (value.trim() && !data[field].includes(value.trim())) {
      updateData({ [field]: [...data[field], value.trim()] })
    }
  }

  const removeItem = (field: 'medicalConditions' | 'injuries' | 'medications' | 'allergies', value: string) => {
    updateData({ [field]: data[field].filter(item => item !== value) })
  }

  const toggleQuickSelect = (field: 'medicalConditions' | 'injuries' | 'allergies', value: string) => {
    if (data[field].includes(value)) {
      removeItem(field, value)
    } else {
      addItem(field, value)
    }
  }

  const handleNext = () => {
    setStep(7)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Medical Information</h2>
        <p className="text-muted-foreground">
          This helps us create safe workouts. All information is kept private.
        </p>
      </div>

      {/* Medical Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" />
            Medical Conditions
          </CardTitle>
          <CardDescription>
            Any conditions we should know about (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {commonConditions.map((condition) => (
              <button
                key={condition}
                type="button"
                onClick={() => toggleQuickSelect('medicalConditions', condition)}
                className={`rounded-full border px-3 py-1 text-sm transition-all ${
                  data.medicalConditions.includes(condition)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {condition}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add other condition..."
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addItem('medicalConditions', conditionInput)
                  setConditionInput('')
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                addItem('medicalConditions', conditionInput)
                setConditionInput('')
              }}
            >
              Add
            </Button>
          </div>
          {data.medicalConditions.filter(c => !commonConditions.includes(c)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.medicalConditions.filter(c => !commonConditions.includes(c)).map((condition) => (
                <Badge key={condition} variant="secondary" className="gap-1 pr-1">
                  {condition}
                  <button
                    type="button"
                    onClick={() => removeItem('medicalConditions', condition)}
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

      {/* Injuries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Injuries or Pain Points
          </CardTitle>
          <CardDescription>
            Any injuries or chronic pain areas (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {commonInjuries.map((injury) => (
              <button
                key={injury}
                type="button"
                onClick={() => toggleQuickSelect('injuries', injury)}
                className={`rounded-full border px-3 py-1 text-sm transition-all ${
                  data.injuries.includes(injury)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {injury}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add other injury..."
              value={injuryInput}
              onChange={(e) => setInjuryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addItem('injuries', injuryInput)
                  setInjuryInput('')
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                addItem('injuries', injuryInput)
                setInjuryInput('')
              }}
            >
              Add
            </Button>
          </div>
          {data.injuries.filter(i => !commonInjuries.includes(i)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.injuries.filter(i => !commonInjuries.includes(i)).map((injury) => (
                <Badge key={injury} variant="secondary" className="gap-1 pr-1">
                  {injury}
                  <button
                    type="button"
                    onClick={() => removeItem('injuries', injury)}
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

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="h-5 w-5 text-primary" />
            Current Medications
          </CardTitle>
          <CardDescription>
            Any medications that might affect exercise (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add medication..."
              value={medicationInput}
              onChange={(e) => setMedicationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addItem('medications', medicationInput)
                  setMedicationInput('')
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                addItem('medications', medicationInput)
                setMedicationInput('')
              }}
            >
              Add
            </Button>
          </div>
          {data.medications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.medications.map((medication) => (
                <Badge key={medication} variant="secondary" className="gap-1 pr-1">
                  {medication}
                  <button
                    type="button"
                    onClick={() => removeItem('medications', medication)}
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

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Apple className="h-5 w-5 text-primary" />
            Food Allergies
          </CardTitle>
          <CardDescription>
            For your personalized diet plan (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {commonAllergies.map((allergy) => (
              <button
                key={allergy}
                type="button"
                onClick={() => toggleQuickSelect('allergies', allergy)}
                className={`rounded-full border px-3 py-1 text-sm transition-all ${
                  data.allergies.includes(allergy)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {allergy}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add other allergy..."
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addItem('allergies', allergyInput)
                  setAllergyInput('')
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                addItem('allergies', allergyInput)
                setAllergyInput('')
              }}
            >
              Add
            </Button>
          </div>
          {data.allergies.filter(a => !commonAllergies.includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.allergies.filter(a => !commonAllergies.includes(a)).map((allergy) => (
                <Badge key={allergy} variant="secondary" className="gap-1 pr-1">
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeItem('allergies', allergy)}
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
        <Button variant="outline" onClick={() => setStep(5)} className="flex-1">
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
