'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { MapPin, Globe, ArrowLeft, Sparkles, Check } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export function StepLocation() {
  const router = useRouter()
  const { data, updateData, setStep } = useOnboardingStore()
  const { refreshSession } = useAuth()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)

  useEffect(() => {
    // Auto-detect timezone
    if (!data.timezone) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      updateData({ timezone: tz })
    }
  }, [data.timezone, updateData])

  const detectLocation = () => {
    setDetectingLocation(true)
    
    // Use IP-based geolocation as fallback
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        updateData({
          country: data.country_name || '',
          state: data.region || '',
          city: data.city || '',
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })
      .catch(console.error)
      .finally(() => setDetectingLocation(false))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!data.country?.trim()) {
      newErrors.country = 'Country is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save profile')
      }

      // Refresh session to get updated onboarding status
      await refreshSession()
      
      // Redirect to AI analysis page
      router.push('/generating')
    } catch (error) {
      console.error('Submit error:', error)
      setErrors({ submit: 'Failed to save profile. Please try again.' })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Location</h2>
        <p className="text-muted-foreground">
          Your location helps us personalize recommendations and reminders.
        </p>
      </div>

      {/* Auto Detect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Quick Setup
          </CardTitle>
          <CardDescription>
            We can detect your location automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={detectLocation}
            disabled={detectingLocation}
          >
            {detectingLocation ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            {detectingLocation ? 'Detecting...' : 'Detect My Location'}
          </Button>
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Location Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="country">Country *</FieldLabel>
              <Input
                id="country"
                placeholder="United States"
                value={data.country || ''}
                onChange={(e) => updateData({ country: e.target.value })}
              />
              {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="state">State / Province</FieldLabel>
              <Input
                id="state"
                placeholder="California"
                value={data.state || ''}
                onChange={(e) => updateData({ state: e.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input
                id="city"
                placeholder="Los Angeles"
                value={data.city || ''}
                onChange={(e) => updateData({ city: e.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
              <Input
                id="timezone"
                placeholder="America/Los_Angeles"
                value={data.timezone || ''}
                onChange={(e) => updateData({ timezone: e.target.value })}
                readOnly
                className="bg-secondary/50"
              />
              <p className="text-xs text-muted-foreground">Auto-detected from your browser</p>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Ready to Generate Your Plan
          </CardTitle>
          <CardDescription>
            Our AI will analyze your profile and create:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              'Personalized workout plan based on your goals',
              'Custom diet plan matching your preferences',
              'AI body composition analysis',
              'Progress tracking recommendations'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {errors.submit && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {errors.submit}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(7)} className="flex-1" disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Creating Profile...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate My Plan
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
