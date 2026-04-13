'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import useSWR from 'swr'

// Fallback SVG icons for exercises without videos
const exerciseSVGs: Record<string, { icon: string; color: string }> = {
  // Upper Body
  'bench press': { icon: 'M6 10c0-2 2-4 6-4s6 2 6 4M6 10l4 4M18 10l-4 4M6 10v4M18 10v4M10 14h4', color: 'text-primary' },
  'push-up': { icon: 'M4 14c2-4 4-6 8-6s6 2 8 6M4 14l2-3M20 14l-2-3M12 8v6', color: 'text-primary' },
  'push-ups': { icon: 'M4 14c2-4 4-6 8-6s6 2 8 6M4 14l2-3M20 14l-2-3M12 8v6', color: 'text-primary' },
  'shoulder press': { icon: 'M6 16v-6c0-2 2-4 6-4s6 2 6 4v6M8 10l-2-4M16 10l2-4M12 4v2M6 16h12', color: 'text-primary' },
  'bicep curl': { icon: 'M6 16v-8c0-3 2-4 4-4M18 16v-8c0-3-2-4-4-4M6 8l-2-2M18 8l2-2', color: 'text-primary' },
  'pull-ups': { icon: 'M4 6h16M8 6v10c0-4 2-8 4-8s4 4 4 8v-10M8 16h8', color: 'text-primary' },
  
  // Lower Body
  'squat': { icon: 'M6 6v6M18 6v6M8 12c-1 3-2 6-2 6M16 12c1 3 2 6 2 6M6 18h12', color: 'text-chart-2' },
  'squats': { icon: 'M6 6v6M18 6v6M8 12c-1 3-2 6-2 6M16 12c1 3 2 6 2 6M6 18h12', color: 'text-chart-2' },
  'deadlift': { icon: 'M4 18h16M12 18V4M8 6l4-2 4 2M10 12l2 2 2-2', color: 'text-chart-2' },
  'lunges': { icon: 'M8 6v8M16 10v8M6 14l4 4M18 14l-4 4M10 14h4', color: 'text-chart-2' },
  'leg press': { icon: 'M4 12h8M12 6v8c2 0 4 2 4 4M20 10l-4 6', color: 'text-chart-2' },
  
  // Core
  'plank': { icon: 'M4 12h16M4 12v2M20 12v2M6 10l2 4 2-4M14 10l2 4 2-4', color: 'text-chart-4' },
  'crunches': { icon: 'M4 16c2-2 4-4 8-4s6 2 8 4M8 8c1 2 2 4 4 4s3-2 4-4', color: 'text-chart-4' },
  'sit-ups': { icon: 'M4 16c2-2 4-4 8-4s6 2 8 4M12 4v8M8 12l4-4 4 4', color: 'text-chart-4' },
  'russian twists': { icon: 'M12 8v8M6 12h12M8 10l4-2 4 2M8 14l4 2 4-2', color: 'text-chart-4' },
  'leg raises': { icon: 'M4 8h16M12 8l-2 4-2-4M12 8l2 4 2-4M8 12v6M16 12v6', color: 'text-chart-4' },
  'mountain climbers': { icon: 'M4 16l4-4 4 4 4-8 4 4M12 8v4', color: 'text-chart-4' },
  
  // Cardio
  'jumping jacks': { icon: 'M12 4v4M6 8l-4 4M18 8l4 4M8 12l-4 6M16 12l4 6', color: 'text-chart-1' },
  'burpees': { icon: 'M12 2v4M8 6h8M12 6v6M6 12h12M12 12v4M8 16h8', color: 'text-chart-1' },
  'high knees': { icon: 'M8 8v6M16 8v6M10 8l-2 4 2 4M14 8l2 4-2 4', color: 'text-chart-1' },
  'running': { icon: 'M4 16l2-4 2 2 2-4 2 2 2-4 2 2 2-4', color: 'text-chart-1' },
  
  // Default
  'default': { icon: 'M12 4v16M4 12h16M8 8l4-4 4 4M8 16l4 4 4-4', color: 'text-muted-foreground' }
}

interface ExerciseAnimationProps {
  exerciseName: string
  videoUrl?: string // Can be passed directly or fetched from DB
  autoplay?: boolean
  loop?: boolean
  showControls?: boolean
  size?: 'sm' | 'md' | 'lg'
  muted?: boolean
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function ExerciseAnimation({
  exerciseName,
  videoUrl: propVideoUrl,
  autoplay = true,
  loop = true,
  showControls = true,
  size = 'md',
  muted: initialMuted = true
}: ExerciseAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isMuted, setIsMuted] = useState(initialMuted)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Fetch video URL from database if not provided
  const { data: exerciseData } = useSWR(
    !propVideoUrl ? `/api/exercises/video?name=${encodeURIComponent(exerciseName)}` : null,
    fetcher
  )

  const videoUrl = propVideoUrl || exerciseData?.videoUrl
  const normalizedName = exerciseName.toLowerCase().trim()

  const sizeClasses = {
    sm: 'h-32 w-32',
    md: 'h-48 w-48',
    lg: 'h-64 w-64'
  }

  const videoSizeClasses = {
    sm: 'max-h-32',
    md: 'max-h-48',
    lg: 'max-h-64'
  }

  // Video controls
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {})
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  const togglePlayPause = () => setIsPlaying(!isPlaying)
  const toggleMute = () => setIsMuted(!isMuted)
  
  const resetVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
        setIsFullscreen(false)
      } else {
        videoRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    }
  }

  // Get SVG fallback
  const getSvgData = () => {
    if (exerciseSVGs[normalizedName]) {
      return exerciseSVGs[normalizedName]
    }
    for (const [key, value] of Object.entries(exerciseSVGs)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return value
      }
    }
    return exerciseSVGs['default']
  }

  const svgData = getSvgData()

  // Render video player if video URL is available
  if (videoUrl) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className={`relative rounded-xl overflow-hidden bg-black ${videoSizeClasses[size]} w-full max-w-md`}>
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay={autoplay}
            loop={loop}
            muted={isMuted}
            playsInline
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Video overlay with exercise name */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-white text-sm font-medium capitalize">{exerciseName}</p>
          </div>
        </div>
        
        {showControls && (
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
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
                onClick={resetVideo}
                className="h-10 w-10"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
                className="h-10 w-10"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                className="h-10 w-10"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs text-muted-foreground w-12">Speed</span>
              <Slider
                value={[playbackRate]}
                onValueChange={([val]) => setPlaybackRate(val)}
                min={0.25}
                max={2}
                step={0.25}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">{playbackRate}x</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Animated SVG fallback when no video is available
  return (
    <div className="flex flex-col items-center gap-4">
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
            style={{ animationDuration: `${1 / playbackRate}s` }}
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
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
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
