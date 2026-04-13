'use client'

import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import { Loader2 } from 'lucide-react'

interface ExerciseAnimationProps {
  exerciseName: string
  equipment?: string
  gender?: string
  className?: string
}

export function ExerciseAnimation({
  exerciseName,
  equipment = 'Dumbbell',
  gender = 'Men',
  className = ''
}: ExerciseAnimationProps) {
  const [lottieData, setLottieData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchLottieData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/exercises/lottie?name=${encodeURIComponent(exerciseName)}&equipment=${encodeURIComponent(equipment)}&gender=${encodeURIComponent(gender)}`
        )

        if (response.ok) {
          const data = await response.json()
          setLottieData(data.lottieData)
          setError(false)
        } else {
          setError(true)
          console.error('Failed to fetch Lottie data:', response.statusText)
        }
      } catch (err) {
        setError(true)
        console.error('Error fetching Lottie:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLottieData()
  }, [exerciseName, equipment, gender])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading animation...</p>
        </div>
      </div>
    )
  }

  if (error || !lottieData) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Animation not available</p>
          <p className="text-xs text-muted-foreground mt-1">{exerciseName}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center bg-background rounded-lg overflow-hidden ${className}`}>
      <Lottie
        animationData={lottieData}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
