'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Dumbbell, Brain, Utensils, Target, Check, Sparkles } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

const steps = [
  { icon: Brain, label: 'Analyzing your profile', duration: 2000 },
  { icon: Target, label: 'Understanding your goals', duration: 2000 },
  { icon: Dumbbell, label: 'Generating workout plan', duration: 3000 },
  { icon: Utensils, label: 'Creating diet plan', duration: 2000 },
  { icon: Sparkles, label: 'Finalizing recommendations', duration: 1000 }
]

export default function GeneratingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    let stepTimer: NodeJS.Timeout

    const progressSteps = () => {
      if (currentStep < steps.length - 1) {
        stepTimer = setTimeout(() => {
          setCurrentStep(prev => prev + 1)
        }, steps[currentStep].duration)
      }
    }

    progressSteps()
    return () => clearTimeout(stepTimer)
  }, [currentStep])

  useEffect(() => {
    // Start AI generation
    const generatePlan = async () => {
      try {
        const response = await fetch('/api/ai/generate-plan', {
          method: 'POST'
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to generate plan')
        }

        setIsComplete(true)
        setCurrentStep(steps.length) // Mark all steps complete
        
        // Wait a moment then redirect
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } catch (err) {
        console.error('Generation error:', err)
        setError(err instanceof Error ? err.message : 'Failed to generate your plan')
      }
    }

    if (user) {
      generatePlan()
    }
  }, [user, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo Animation */}
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-primary/30" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {isComplete ? 'Your Plan is Ready!' : 'Creating Your Plan'}
          </h1>
          <p className="text-muted-foreground">
            {isComplete 
              ? 'Redirecting to your dashboard...' 
              : 'Our AI is analyzing your profile and creating a personalized fitness journey.'}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep && !isComplete
            const isCompleted = index < currentStep || isComplete
            
            return (
              <div
                key={index}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-all duration-500 ${
                  isActive
                    ? 'border-primary bg-primary/10'
                    : isCompleted
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-border bg-secondary/30 opacity-50'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isCompleted
                    ? 'bg-green-500'
                    : isActive
                    ? 'bg-primary'
                    : 'bg-secondary'
                }`}>
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : isActive ? (
                    <Spinner className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <span className={`font-medium ${
                  isActive ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            <p className="font-medium">Something went wrong</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 text-sm underline hover:no-underline"
            >
              Go to Dashboard anyway
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
