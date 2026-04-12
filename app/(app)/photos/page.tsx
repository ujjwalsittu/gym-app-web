'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, Calendar, Image as ImageIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function PhotosPage() {
  const { data, isLoading } = useSWR('/api/photos', fetcher)
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side'>('slider')
  const [leftDateIndex, setLeftDateIndex] = useState(0)
  const [rightDateIndex, setRightDateIndex] = useState(0)
  const [selectedPhotoType, setSelectedPhotoType] = useState<'front' | 'left' | 'right'>('front')
  const [sliderValue, setSliderValue] = useState([50])

  const photoSets = data?.photoSets || []
  
  // Set default comparison dates
  useMemo(() => {
    if (photoSets.length >= 2) {
      setLeftDateIndex(photoSets.length - 1) // Oldest
      setRightDateIndex(0) // Latest
    }
  }, [photoSets.length])

  const getPhotoUrl = (photos: any[], type: string) => {
    const photo = photos.find((p: any) => p.photo_type === type)
    if (!photo) return null
    return `/api/file?pathname=${encodeURIComponent(photo.blob_pathname)}`
  }

  const leftPhotos = photoSets[leftDateIndex]?.photos || []
  const rightPhotos = photoSets[rightDateIndex]?.photos || []
  const leftPhoto = getPhotoUrl(leftPhotos, selectedPhotoType)
  const rightPhoto = getPhotoUrl(rightPhotos, selectedPhotoType)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Progress Photos</h1>
          </div>
          <Link href="/photos/upload">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Photos
            </Button>
          </Link>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-lg mx-auto">
        {photoSets.length < 2 ? (
          <Card className="bg-card">
            <CardContent className="p-8 text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold mb-2">Track Your Progress</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {photoSets.length === 0 
                  ? 'Upload your first progress photos to start tracking your transformation!'
                  : 'Take another set of photos to compare your progress!'}
              </p>
              <Link href="/photos/upload">
                <Button>
                  <Camera className="h-4 w-4 mr-2" />
                  {photoSets.length === 0 ? 'Upload First Photos' : 'Add New Photos'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Date Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Before</label>
                <Select 
                  value={leftDateIndex.toString()} 
                  onValueChange={(v) => setLeftDateIndex(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {photoSets.map((set: any, i: number) => (
                      <SelectItem key={i} value={i.toString()}>
                        {new Date(set.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">After</label>
                <Select 
                  value={rightDateIndex.toString()} 
                  onValueChange={(v) => setRightDateIndex(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {photoSets.map((set: any, i: number) => (
                      <SelectItem key={i} value={i.toString()}>
                        {new Date(set.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Photo Type Selector */}
            <div className="flex gap-2">
              {(['front', 'left', 'right'] as const).map((type) => (
                <Button
                  key={type}
                  variant={selectedPhotoType === type ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSelectedPhotoType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>

            {/* Comparison Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={comparisonMode === 'slider' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setComparisonMode('slider')}
              >
                Slider
              </Button>
              <Button
                variant={comparisonMode === 'side-by-side' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setComparisonMode('side-by-side')}
              >
                Side by Side
              </Button>
            </div>

            {/* Photo Comparison */}
            {comparisonMode === 'slider' ? (
              <Card className="bg-card overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {/* Before (Left) Photo */}
                    {leftPhoto && (
                      <div 
                        className="absolute inset-0"
                        style={{ clipPath: `inset(0 ${100 - sliderValue[0]}% 0 0)` }}
                      >
                        <img 
                          src={leftPhoto} 
                          alt="Before" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4 bg-background/80 px-2 py-1 rounded text-xs font-medium">
                          Before
                        </div>
                      </div>
                    )}
                    
                    {/* After (Right) Photo */}
                    {rightPhoto && (
                      <div 
                        className="absolute inset-0"
                        style={{ clipPath: `inset(0 0 0 ${sliderValue[0]}%)` }}
                      >
                        <img 
                          src={rightPhoto} 
                          alt="After" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-primary/80 px-2 py-1 rounded text-xs font-medium text-primary-foreground">
                          After
                        </div>
                      </div>
                    )}

                    {/* Slider Line */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                      style={{ left: `${sliderValue[0]}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <ChevronLeft className="h-4 w-4 text-background" />
                        <ChevronRight className="h-4 w-4 text-background" />
                      </div>
                    </div>

                    {!leftPhoto && !rightPhoto && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No {selectedPhotoType} photos available</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <Slider
                      value={sliderValue}
                      onValueChange={setSliderValue}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Card className="bg-card overflow-hidden">
                  <CardHeader className="p-2">
                    <CardTitle className="text-xs text-center">Before</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="aspect-[3/4]">
                      {leftPhoto ? (
                        <img 
                          src={leftPhoto} 
                          alt="Before" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card overflow-hidden">
                  <CardHeader className="p-2">
                    <CardTitle className="text-xs text-center">After</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="aspect-[3/4]">
                      {rightPhoto ? (
                        <img 
                          src={rightPhoto} 
                          alt="After" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Timeline */}
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Photo Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {photoSets.slice(0, 5).map((set: any, i: number) => (
                    <div 
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        if (i === rightDateIndex) {
                          setLeftDateIndex(i)
                        } else {
                          setRightDateIndex(i)
                        }
                      }}
                    >
                      <div className="h-10 w-10 rounded bg-muted overflow-hidden">
                        {set.photos[0] && (
                          <img 
                            src={`/api/file?pathname=${encodeURIComponent(set.photos[0].blob_pathname)}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {new Date(set.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {set.photos.length} photo{set.photos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
