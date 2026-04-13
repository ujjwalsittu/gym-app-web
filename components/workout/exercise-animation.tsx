'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, RotateCcw } from 'lucide-react'

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

// Exercise animation data - using inline animations for common exercises
// This avoids needing external files and ensures fast loading
const exerciseAnimations: Record<string, object> = {
  // Simplified animation data for exercises
  // In production, these would be full Lottie JSON files
}

// Fallback SVG animations for exercises without Lottie files
// Each exercise now has context-specific SVG paths that better represent the movement
const exerciseSVGs: Record<string, { icon: string; color: string }> = {
  // Upper Body - Chest/Arms
  'bench press': { icon: 'M6 10c0-2 2-4 6-4s6 2 6 4M6 10l4 4M18 10l-4 4M6 10v4M18 10v4M10 14h4', color: 'text-primary' },
  'push-up': { icon: 'M4 14c2-4 4-6 8-6s6 2 8 6M4 14l2-3M20 14l-2-3M12 8v6M8 10l2-2M16 10l-2-2', color: 'text-primary' },
  'push-ups': { icon: 'M4 14c2-4 4-6 8-6s6 2 8 6M4 14l2-3M20 14l-2-3M12 8v6M8 10l2-2M16 10l-2-2', color: 'text-primary' },
  'shoulder press': { icon: 'M6 16v-6c0-2 2-4 6-4s6 2 6 4v6M8 10l-2-4M16 10l2-4M12 4v2M6 16h12', color: 'text-primary' },
  'bicep curl': { icon: 'M6 16v-8c0-3 2-4 4-4M18 16v-8c0-3-2-4-4-4M6 8l-2-2M18 8l2-2M8 12c2-2 2-4 2-4M16 12c-2-2-2-4-2-4', color: 'text-primary' },
  'bicep curls': { icon: 'M6 16v-8c0-3 2-4 4-4M18 16v-8c0-3-2-4-4-4M6 8l-2-2M18 8l2-2M8 12c2-2 2-4 2-4M16 12c-2-2-2-4-2-4', color: 'text-primary' },
  'tricep dips': { icon: 'M4 8h16M6 8v8M18 8v8M10 8c0 4-2 8-2 8M14 8c0 4 2 8 2 8M6 16h12', color: 'text-primary' },
  'pull-ups': { icon: 'M4 6h16M8 6v10c0-4 2-8 4-8s4 4 4 8v-10M8 16h8M10 8l2-4 2 4', color: 'text-primary' },
  'lat pulldown': { icon: 'M4 6h16M8 6v8M16 6v8M6 10l6-4 6 4M6 14h12', color: 'text-primary' },
  'rows': { icon: 'M4 12h12M16 8l-4 4-4-4M16 8v8M14 12h2M6 12h2', color: 'text-primary' },
  'dumbbell rows': { icon: 'M4 12h12M16 8l-4 4-4-4M16 8v8M14 12h2M6 12h2M2 8v8M22 8v8', color: 'text-primary' },
  
  // Lower Body - Quads/Glutes
  'squat': { icon: 'M6 6v6M18 6v6M8 12c-1 3-2 6-2 6M16 12c1 3 2 6 2 6M6 18h12M8 18v2M16 18v2M12 6c0 2-1 4-1 6', color: 'text-chart-2' },
  'squats': { icon: 'M6 6v6M18 6v6M8 12c-1 3-2 6-2 6M16 12c1 3 2 6 2 6M6 18h12M8 18v2M16 18v2M12 6c0 2-1 4-1 6', color: 'text-chart-2' },
  'deadlift': { icon: 'M4 18h16M12 18V4M8 6l4-2 4 2M10 12l2 2 2-2M8 18l2 2 2-2', color: 'text-chart-2' },
  'deadlifts': { icon: 'M4 18h16M12 18V4M8 6l4-2 4 2M10 12l2 2 2-2M8 18l2 2 2-2', color: 'text-chart-2' },
  'lunges': { icon: 'M8 6v8M16 10v8M6 14l4 4M18 14l-4 4M10 14h4M8 18l2 2 2-2M16 18l-2 2-2-2', color: 'text-chart-2' },
  'leg press': { icon: 'M4 12h8M12 6v8c2 0 4 2 4 4M20 10l-4 6M16 16l-2 2-2-2M8 18h8', color: 'text-chart-2' },
  'calf raises': { icon: 'M6 18v-4M18 18v-4M6 14h12M10 10l2-4 2 4M14 10l2-4 2 4M8 18h2M14 18h2', color: 'text-chart-2' },
  'leg curls': { icon: 'M4 8h16M12 8c-3 0-4 4-4 6M12 8c3 0 4 4 4 6M8 14v4M16 14v4M6 18h12', color: 'text-chart-2' },
  'leg extensions': { icon: 'M4 8h16M12 8c3 0 4 4 4 6M12 8c-3 0-4 4-4 6M8 14v4M16 14v4M6 18h12', color: 'text-chart-2' },
  
  // Core
  'plank': { icon: 'M4 12h16M4 12v2M20 12v2M6 10l2 4 2-4M14 10l2 4 2-4M8 14h8', color: 'text-chart-4' },
  'crunches': { icon: 'M4 16c2-2 4-4 8-4s6 2 8 4M8 8c1 2 2 4 4 4s3-2 4-4M6 14l2-2 2 2M16 14l-2-2-2 2', color: 'text-chart-4' },
  'sit-ups': { icon: 'M4 16c2-2 4-4 8-4s6 2 8 4M12 4v8M8 12l4-4 4 4M6 16h12', color: 'text-chart-4' },
  'russian twists': { icon: 'M12 8v8M6 12h12M8 10l4-2 4 2M8 14l4 2 4-2M4 10l-2 2 2 2M20 10l2 2-2 2', color: 'text-chart-4' },
  'leg raises': { icon: 'M4 8h16M12 8l-2 4-2-4M12 8l2 4 2-4M8 12v6M16 12v6M6 18h12', color: 'text-chart-4' },
  'mountain climbers': { icon: 'M4 16l4-4 4 4 4-8 4 4M12 8v4M8 14l2 2M16 14l-2 2M10 12l2-2 2 2', color: 'text-chart-4' },
  
  // Cardio
  'jumping jacks': { icon: 'M12 4v4M6 8l-4 4M18 8l4 4M8 12l-4 6M16 12l4 6M8 18h2M14 18h2M12 8l-2 4 2 4 2-4-2-4', color: 'text-chart-1' },
  'burpees': { icon: 'M12 2v4M8 6h8M12 6v6M6 12h12M12 12v4M8 16h8M10 4l-2 2 2 2 2-2-2-2', color: 'text-chart-1' },
  'high knees': { icon: 'M8 8v6M16 8v6M10 8l-2 4 2 4M14 8l2 4-2 4M12 4v2M12 14v2', color: 'text-chart-1' },
  'running': { icon: 'M4 16l2-4 2 2 2-4 2 2 2-4 2 2 2-4M8 10l-2-2M16 10l2-2M6 16l8-2', color: 'text-chart-1' },
  'cycling': { icon: 'M6 14a4 4 0 1 0 0-1M18 14a4 4 0 1 0 0-1M6 14h12M8 10l2 2 2-2M14 10l2 2 2-2M10 12v2M14 12v2', color: 'text-chart-1' },
  
  // Default
  'default': { icon: 'M12 4v16M4 12h16M8 8l4-4 4 4M8 16l4 4 4-4', color: 'text-muted-foreground' }
}

interface ExerciseAnimationProps {
  exerciseName: string
  autoplay?: boolean
  loop?: boolean
  showControls?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ExerciseAnimation({
  exerciseName,
  autoplay = true,
  loop = true,
  showControls = true,
  size = 'md'
}: ExerciseAnimationProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const [speed, setSpeed] = useState(1)
  const lottieRef = useRef<any>(null)
  const [hasLottie, setHasLottie] = useState(false)

  const normalizedName = exerciseName.toLowerCase().trim()
  const animationData = exerciseAnimations[normalizedName]
  
  // Get SVG fallback
  const getSvgData = () => {
    // Try exact match first
    if (exerciseSVGs[normalizedName]) {
      return exerciseSVGs[normalizedName]
    }
    // Try partial match
    for (const [key, value] of Object.entries(exerciseSVGs)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return value
      }
    }
    return exerciseSVGs['default']
  }

  const svgData = getSvgData()

  const sizeClasses = {
    sm: 'h-24 w-24',
    md: 'h-40 w-40',
    lg: 'h-56 w-56'
  }

  useEffect(() => {
    if (lottieRef.current) {
      if (isPlaying) {
        lottieRef.current.play()
      } else {
        lottieRef.current.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(speed)
    }
  }, [speed])

  const togglePlayPause = () => setIsPlaying(!isPlaying)
  const resetAnimation = () => {
    if (lottieRef.current) {
      lottieRef.current.goToAndPlay(0)
      setIsPlaying(true)
    }
  }

  // Animated SVG fallback component
  const AnimatedSVG = () => (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
      <div className="absolute inset-0 rounded-full bg-secondary/30" />
      <div className={`relative ${isPlaying ? 'animate-pulse' : ''}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-16 w-16 ${svgData.color} ${isPlaying ? 'animate-bounce' : ''}`}
          style={{ animationDuration: `${1 / speed}s` }}
        >
          <path d={svgData.icon} />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <span className="text-xs text-muted-foreground capitalize">
          {exerciseName}
        </span>
      </div>
    </div>
  )

  if (animationData && hasLottie) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className={sizeClasses[size]}>
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={loop}
            autoplay={autoplay}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        
        {showControls && (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={togglePlayPause}
                className="h-10 w-10"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={resetAnimation}
                className="h-10 w-10"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs text-muted-foreground w-12">Speed</span>
              <Slider
                value={[speed]}
                onValueChange={([val]) => setSpeed(val)}
                min={0.25}
                max={2}
                step={0.25}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">{speed}x</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Use animated SVG fallback
  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatedSVG />
      
      {showControls && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayPause}
            className="h-10 w-10"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <div className="flex items-center gap-2 px-3">
            <span className="text-xs text-muted-foreground">Speed:</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="bg-secondary rounded px-2 py-1 text-xs"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
