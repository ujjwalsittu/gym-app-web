'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Play, Dumbbell, Video, Calendar, Trophy, BookOpen } from 'lucide-react'

interface QuickActionsProps {
  hasActiveSession: boolean
  todayPlan: { name: string } | null
}

export function QuickActions({ hasActiveSession, todayPlan }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <Link href={hasActiveSession ? '/workout/active' : '/workout/start'} className="block col-span-2">
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

      <Link href="/workout/verify" className="block col-span-2">
        <Button 
          variant="secondary" 
          size="lg" 
          className="h-auto w-full flex-col gap-2 py-4"
        >
          <Video className="h-6 w-6" />
          <span>Gym Check-in</span>
        </Button>
      </Link>

      {/* Secondary Actions Row */}
      <Link href="/calendar" className="block">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-auto w-full flex-col gap-1 py-3"
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs">Calendar</span>
        </Button>
      </Link>

      <Link href="/challenges" className="block">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-auto w-full flex-col gap-1 py-3"
        >
          <Trophy className="h-5 w-5" />
          <span className="text-xs">Challenges</span>
        </Button>
      </Link>

      <Link href="/exercises" className="block">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-auto w-full flex-col gap-1 py-3"
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-xs">Exercises</span>
        </Button>
      </Link>

      <Link href="/coach" className="block">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-auto w-full flex-col gap-1 py-3"
        >
          <Dumbbell className="h-5 w-5" />
          <span className="text-xs">AI Coach</span>
        </Button>
      </Link>

      {todayPlan && !hasActiveSession && (
        <div className="col-span-4 rounded-lg border border-border/50 bg-primary/5 p-3 text-center">
          <p className="text-sm text-muted-foreground">{"Today's focus:"}</p>
          <p className="font-semibold text-primary">{todayPlan.name}</p>
        </div>
      )}
    </div>
  )
}
