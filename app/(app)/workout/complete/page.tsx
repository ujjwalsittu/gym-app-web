'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Flame, Clock, Dumbbell, Home, Share2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

export default function WorkoutCompletePage() {
  useEffect(() => {
    // Trigger confetti on mount
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Trophy */}
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Workout Complete!</h1>
          <p className="text-muted-foreground">
            Great job! You crushed it today.
          </p>
        </div>

        {/* Stats Card */}
        <Card>
          <CardContent className="grid grid-cols-3 gap-4 p-6">
            <div className="text-center">
              <Clock className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-2 text-2xl font-bold">45</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div className="text-center">
              <Flame className="mx-auto h-6 w-6 text-orange-500" />
              <p className="mt-2 text-2xl font-bold">320</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div className="text-center">
              <Dumbbell className="mx-auto h-6 w-6 text-blue-500" />
              <p className="mt-2 text-2xl font-bold">6</p>
              <p className="text-xs text-muted-foreground">Exercises</p>
            </div>
          </CardContent>
        </Card>

        {/* Motivational Message */}
        <div className="rounded-lg border border-primary/50 bg-primary/10 p-4">
          <p className="font-medium text-primary">
            {"You're building a stronger version of yourself!"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep up the consistency and watch the results come.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/dashboard" className="block">
            <Button className="w-full" size="lg">
              <Home className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Button>
          </Link>
          <Button variant="outline" className="w-full" size="lg">
            <Share2 className="mr-2 h-5 w-5" />
            Share Achievement
          </Button>
        </div>
      </div>
    </div>
  )
}
