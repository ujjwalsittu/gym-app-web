'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useOnboardingStore, TOTAL_STEPS } from '@/lib/onboarding-store'
import { OnboardingProgress } from '@/components/onboarding/progress'
import { StepPersonalInfo } from '@/components/onboarding/step-personal-info'
import { StepLifestyle } from '@/components/onboarding/step-lifestyle'
import { StepDiet } from '@/components/onboarding/step-diet'
import { StepHabits } from '@/components/onboarding/step-habits'
import { StepFitnessGoals } from '@/components/onboarding/step-fitness-goals'
import { StepMedical } from '@/components/onboarding/step-medical'
import { StepPhotos } from '@/components/onboarding/step-photos'
import { StepLocation } from '@/components/onboarding/step-location'
import { Dumbbell } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { currentStep } = useOnboardingStore()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    if (!loading && user?.onboarding_completed) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepPersonalInfo />
      case 2:
        return <StepLifestyle />
      case 3:
        return <StepDiet />
      case 4:
        return <StepHabits />
      case 5:
        return <StepFitnessGoals />
      case 6:
        return <StepMedical />
      case 7:
        return <StepPhotos />
      case 8:
        return <StepLocation />
      default:
        return <StepPersonalInfo />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Dumbbell className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">VisionaryFit</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 py-6">
        {renderStep()}
      </main>
    </div>
  )
}
