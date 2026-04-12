'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Check } from 'lucide-react'

interface DayPlan {
  day: string
  name: string
  focus: string
  durationMinutes: number
}

interface WeeklyPlanProps {
  plan: DayPlan[]
  currentDay: string
}

export function WeeklyPlan({ plan, currentDay }: WeeklyPlanProps) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const currentDayIndex = days.findIndex(d => d.toLowerCase() === currentDay.toLowerCase())

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Weekly Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {days.map((day, index) => {
            const dayPlan = plan.find(p => p.day.toLowerCase() === day.toLowerCase())
            const isPast = index < currentDayIndex
            const isToday = index === currentDayIndex
            const isFuture = index > currentDayIndex
            
            return (
              <div
                key={day}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  isToday 
                    ? 'border-primary bg-primary/10' 
                    : isPast 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    isToday 
                      ? 'bg-primary text-primary-foreground' 
                      : isPast 
                      ? 'bg-green-500 text-white' 
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {isPast ? <Check className="h-4 w-4" /> : day.slice(0, 2)}
                  </div>
                  <div>
                    <p className={`font-medium ${isFuture ? 'text-muted-foreground' : ''}`}>
                      {day}
                      {isToday && <span className="ml-2 text-xs text-primary">Today</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dayPlan ? dayPlan.name : 'Rest Day'}
                    </p>
                  </div>
                </div>
                {dayPlan && (
                  <span className="text-sm text-muted-foreground">
                    {dayPlan.durationMinutes}min
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
