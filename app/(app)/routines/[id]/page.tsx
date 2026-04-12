'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ChevronLeft, 
  Play, 
  Pause,
  SkipForward,
  RotateCcw,
  Check,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { ExerciseAnimation } from '@/components/workout/exercise-animation'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function RoutinePlayerPage() {
  const router = useRouter()
  const params = useParams()
  const { data, isLoading } = useSWR(`/api/routines/${params.id}`, fetcher)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const routine = data?.routine
  const exercises = routine?.exercises || []
  const currentExercise = exercises[currentIndex]

  // Initialize timer when exercise changes
  useEffect(() => {
    if (currentExercise) {
      setTimeRemaining(currentExercise.duration || 30)
    }
  }, [currentIndex, currentExercise])

  // Timer logic
  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Play sound
            if (soundEnabled) {
              playBeep()
            }
            
            // Move to next exercise or complete
            if (currentIndex < exercises.length - 1) {
              setCurrentIndex(prev => prev + 1)
              return exercises[currentIndex + 1]?.duration || 30
            } else {
              setIsPlaying(false)
              setIsComplete(true)
              return 0
            }
          }
          
          // Play tick sound at 3, 2, 1
          if (prev <= 4 && soundEnabled) {
            playTick()
          }
          
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, currentIndex, exercises, soundEnabled])

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 1000
      gainNode.gain.value = 0.3
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (e) {
      // Audio not supported
    }
  }

  const playTick = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      gainNode.gain.value = 0.1
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.05)
    } catch (e) {
      // Audio not supported
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const skipToNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsComplete(true)
      setIsPlaying(false)
    }
  }

  const restart = () => {
    setCurrentIndex(0)
    setTimeRemaining(exercises[0]?.duration || 30)
    setIsComplete(false)
    setIsPlaying(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Routine not found</p>
      </div>
    )
  }

  // Completion screen
  if (isComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="rounded-full bg-green-500/20 p-6 mb-6">
          <Check className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Routine Complete!</h1>
        <p className="text-muted-foreground mb-6">
          Great job completing {routine.name}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={restart}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Do Again
          </Button>
          <Button onClick={() => router.push('/routines')}>
            Done
          </Button>
        </div>
      </div>
    )
  }

  const progress = ((currentIndex) / exercises.length) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-sm font-medium">{routine.name}</h1>
            <p className="text-xs text-muted-foreground">
              {currentIndex + 1} of {exercises.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <main className="mx-auto max-w-lg p-4">
        {/* Current Exercise */}
        {currentExercise && (
          <div className="space-y-6">
            {/* Animation */}
            <div className="flex justify-center py-8">
              <ExerciseAnimation
                exerciseName={currentExercise.name}
                autoplay={isPlaying}
                showControls={false}
                size="lg"
              />
            </div>

            {/* Exercise Name */}
            <div className="text-center">
              <h2 className="text-2xl font-bold">{currentExercise.name}</h2>
              {currentExercise.instructions && (
                <p className="mt-2 text-muted-foreground">
                  {currentExercise.instructions}
                </p>
              )}
            </div>

            {/* Timer */}
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className={`text-7xl font-mono font-bold tabular-nums ${
                    timeRemaining <= 3 ? 'text-red-500' : ''
                  }`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {currentExercise.reps 
                      ? `${currentExercise.reps} reps` 
                      : `Hold for ${currentExercise.duration || 30} seconds`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={restart}
              >
                <RotateCcw className="h-6 w-6" />
              </Button>

              <Button
                size="icon"
                className={`h-20 w-20 rounded-full ${
                  isPlaying ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                }`}
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={skipToNext}
              >
                <SkipForward className="h-6 w-6" />
              </Button>
            </div>

            {/* Next Up */}
            {currentIndex < exercises.length - 1 && (
              <Card className="bg-secondary/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Next up:</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {exercises[currentIndex + 1]?.name}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {exercises[currentIndex + 1]?.duration || 30}s
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Exercises List */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Routine Overview</h3>
                <div className="space-y-2">
                  {exercises.map((ex: any, idx: number) => (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between rounded-lg p-2 ${
                        idx === currentIndex 
                          ? 'bg-primary/10 ring-1 ring-primary' 
                          : idx < currentIndex 
                            ? 'bg-green-500/10' 
                            : 'bg-secondary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          idx < currentIndex 
                            ? 'bg-green-500 text-white' 
                            : idx === currentIndex 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary text-muted-foreground'
                        }`}>
                          {idx < currentIndex ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span className={idx < currentIndex ? 'line-through text-muted-foreground' : ''}>
                          {ex.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {ex.duration || 30}s
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
