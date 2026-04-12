'use client'

import { useState, useRef } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, User, ArrowLeft, ArrowRight, Upload, X, RotateCw } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

type PhotoType = 'photoFront' | 'photoLeft' | 'photoRight'

const photoConfig = {
  photoFront: { label: 'Front View', description: 'Face the camera directly' },
  photoLeft: { label: 'Left Profile', description: 'Turn to your left side' },
  photoRight: { label: 'Right Profile', description: 'Turn to your right side' }
}

export function StepPhotos() {
  const { data, updateData, setStep } = useOnboardingStore()
  const [uploading, setUploading] = useState<PhotoType | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRefs = {
    photoFront: useRef<HTMLInputElement>(null),
    photoLeft: useRef<HTMLInputElement>(null),
    photoRight: useRef<HTMLInputElement>(null)
  }

  const handleFileSelect = async (type: PhotoType, file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors({ [type]: 'Please select an image file' })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors({ [type]: 'Image must be less than 10MB' })
      return
    }

    setUploading(type)
    setErrors({})

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { url } = await response.json()
      updateData({ [type]: url })
    } catch (error) {
      console.error('Upload error:', error)
      setErrors({ [type]: 'Failed to upload. Please try again.' })
    } finally {
      setUploading(null)
    }
  }

  const removePhoto = (type: PhotoType) => {
    updateData({ [type]: null })
    if (fileInputRefs[type].current) {
      fileInputRefs[type].current.value = ''
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!data.photoFront) {
      newErrors.photoFront = 'Front photo is required'
    }
    if (!data.photoLeft) {
      newErrors.photoLeft = 'Left profile photo is required'
    }
    if (!data.photoRight) {
      newErrors.photoRight = 'Right profile photo is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      setStep(8)
    }
  }

  const PhotoUploader = ({ type }: { type: PhotoType }) => {
    const config = photoConfig[type]
    const photo = data[type]
    const isUploading = uploading === type
    const error = errors[type]

    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">{config.label}</div>
        <div className="text-xs text-muted-foreground">{config.description}</div>
        
        <input
          ref={fileInputRefs[type]}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(type, file)
          }}
        />

        {photo ? (
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 border-primary">
            <img
              src={photo}
              alt={config.label}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 right-2 flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0"
                onClick={() => fileInputRefs[type].current?.click()}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0"
                onClick={() => removePhoto(type)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRefs[type].current?.click()}
            disabled={isUploading}
            className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/30 transition-all hover:border-primary hover:bg-secondary/50"
          >
            {isUploading ? (
              <Spinner className="h-8 w-8" />
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">Take Photo</div>
                  <div className="text-xs text-muted-foreground">or upload from gallery</div>
                </div>
              </>
            )}
          </button>
        )}
        
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Body Photos</h2>
        <p className="text-muted-foreground">
          Take 3 photos for AI body analysis. This helps create your personalized workout plan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Photo Guidelines
          </CardTitle>
          <CardDescription>
            For accurate analysis, please follow these tips:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              Wear minimal, fitted clothing (shorts and sports bra/tank top)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              Good lighting, plain background
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              Stand naturally with arms slightly away from body
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              Include face in frame for proper posture analysis
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-primary" />
            Upload Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <PhotoUploader type="photoFront" />
            <PhotoUploader type="photoLeft" />
            <PhotoUploader type="photoRight" />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Camera className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Privacy Protected</div>
            <div className="text-sm text-muted-foreground">
              Your photos are encrypted and only used for AI analysis. They are never shared.
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(6)} className="flex-1">
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
