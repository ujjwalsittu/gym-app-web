'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, Camera, Check, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type PhotoType = 'front' | 'left' | 'right'

export default function PhotoUploadPage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<Record<PhotoType, File | null>>({
    front: null,
    left: null,
    right: null
  })
  const [previews, setPreviews] = useState<Record<PhotoType, string | null>>({
    front: null,
    left: null,
    right: null
  })
  const [activeCapture, setActiveCapture] = useState<PhotoType | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    left: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null)
  }

  const handleFileSelect = (type: PhotoType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotos(prev => ({ ...prev, [type]: file }))
      const url = URL.createObjectURL(file)
      setPreviews(prev => ({ ...prev, [type]: url }))
    }
    setActiveCapture(null)
  }

  const removePhoto = (type: PhotoType) => {
    if (previews[type]) {
      URL.revokeObjectURL(previews[type]!)
    }
    setPhotos(prev => ({ ...prev, [type]: null }))
    setPreviews(prev => ({ ...prev, [type]: null }))
  }

  const hasAnyPhoto = Object.values(photos).some(p => p !== null)

  const handleUpload = async () => {
    const photosToUpload = Object.entries(photos).filter(([_, file]) => file !== null)
    if (photosToUpload.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < photosToUpload.length; i++) {
        const [type, file] = photosToUpload[i]
        const formData = new FormData()
        formData.append('file', file as File)
        formData.append('type', type)

        const response = await fetch('/api/upload/photo', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${type} photo`)
        }

        setUploadProgress(((i + 1) / photosToUpload.length) * 100)
      }

      router.push('/photos')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload photos. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const photoTypes: { type: PhotoType; label: string; description: string }[] = [
    { type: 'front', label: 'Front View', description: 'Stand facing the camera' },
    { type: 'left', label: 'Left Profile', description: 'Turn to show left side' },
    { type: 'right', label: 'Right Profile', description: 'Turn to show right side' }
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/photos">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Add Progress Photos</h1>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground text-center">
          Take photos from each angle for accurate progress tracking
        </p>

        {/* Photo Capture Cards */}
        <div className="space-y-4">
          {photoTypes.map(({ type, label, description }) => (
            <Card key={type} className="bg-card overflow-hidden">
              <CardContent className="p-0">
                {previews[type] ? (
                  <div className="relative">
                    <img 
                      src={previews[type]!} 
                      alt={label}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button 
                        size="icon" 
                        variant="secondary"
                        onClick={() => fileInputRefs[type].current?.click()}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="destructive"
                        onClick={() => removePhoto(type)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded flex items-center gap-1">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="aspect-[3/4] flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRefs[type].current?.click()}
                  >
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">{label}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                    <p className="text-xs text-primary mt-2">Tap to capture</p>
                  </div>
                )}
                <input
                  ref={fileInputRefs[type]}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => handleFileSelect(type, e)}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Spinner className="h-6 w-6" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Uploading photos...</p>
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        <Button 
          className="w-full" 
          size="lg"
          disabled={!hasAnyPhoto || isUploading}
          onClick={handleUpload}
        >
          {isUploading ? (
            <>
              <Spinner className="h-4 w-4 mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Save Progress Photos
            </>
          )}
        </Button>
      </main>
    </div>
  )
}
