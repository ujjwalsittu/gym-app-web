'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Play, Pause, Dumbbell, Video } from 'lucide-react'

interface QuickActionsProps {
  hasActiveSession: boolean
  todayPlan: { name: string } | null
}

export function QuickActions({ hasActiveSession, todayPlan }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link href={hasActiveSession ? '/workout/active' : '/workout/start'} className="block">
        <Button 
          size="lg" 
          className="h-auto w-full flex-col gap-2 py-4"
        >
          {hasActiveSession ? (
            <>
              <Play className="h-6 w-6" />
              <span>Continue Workout</span>
            </>
          ) : (
            <>
              <Dumbbell className="h-6 w-6" />
              <span>Start Workout</span>
            </>
          )}
        </Button>
      </Link>

      <Link href="/workout/verify" className="block">
        <Button 
          variant="secondary" 
          size="lg" 
          className="h-auto w-full flex-col gap-2 py-4"
        >
          <Video className="h-6 w-6" />
          <span>Gym Check-in</span>
        </Button>
      </Link>

      {todayPlan && !hasActiveSession && (
        <div className="col-span-2 rounded-lg border border-border/50 bg-primary/5 p-3 text-center">
          <p className="text-sm text-muted-foreground">{"Today's focus:"}</p>
          <p className="font-semibold text-primary">{todayPlan.name}</p>
        </div>
      )}
    </div>
  )
}
