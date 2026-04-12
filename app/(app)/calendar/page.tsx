'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Clock, 
  Dumbbell,
  Trophy,
  CheckCircle2,
  Calendar as CalendarIcon,
  Zap
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalendarDay {
  date: string
  hasWorkout: boolean
  isScheduled: boolean
  isRestDay: boolean
  session?: {
    id: string
    status: string
    gymVerified: boolean
    duration: number
    calories: number
    exercises: number
  }
  scheduledWorkout?: string
}

export default function CalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const { data, isLoading } = useSWR(
    `/api/calendar?year=${year}&month=${month}`,
    fetcher
  )

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1))
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1))
    setSelectedDay(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDay(null)
  }

  // Get first day of month and days in month
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  // Create calendar grid
  const calendarGrid: (CalendarDay | null)[] = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.push(null)
  }
  
  // Add days of the month
  if (data?.days) {
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayData = data.days.find((d: CalendarDay) => d.date === dateStr)
      calendarGrid.push(dayData || { date: dateStr, hasWorkout: false, isScheduled: false, isRestDay: true })
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold">{MONTHS[month - 1]} {year}</h1>
              <button 
                onClick={goToToday}
                className="text-sm text-primary hover:underline"
              >
                Today
              </button>
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Monthly Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="bg-card">
            <CardContent className="p-3 text-center">
              <Dumbbell className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{data?.stats?.completedWorkouts || 0}</p>
              <p className="text-xs text-muted-foreground">Workouts</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-chart-2" />
              <p className="text-lg font-bold">{data?.stats?.totalMinutes || 0}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-3 text-center">
              <Flame className="h-5 w-5 mx-auto mb-1 text-chart-1" />
              <p className="text-lg font-bold">{data?.stats?.totalCalories || 0}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-3 text-center">
              <Zap className="h-5 w-5 mx-auto mb-1 text-chart-4" />
              <p className="text-lg font-bold">{data?.stats?.currentStreak || 0}</p>
              <p className="text-xs text-muted-foreground">Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const dayNum = parseInt(day.date.split('-')[2])
                const isToday = day.date === today
                const isSelected = selectedDay?.date === day.date
                const isPast = new Date(day.date) < new Date(today)

                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDay(day)}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center relative
                      transition-all duration-200
                      ${isToday ? 'ring-2 ring-primary' : ''}
                      ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                      ${!isSelected && day.hasWorkout ? 'bg-green-500/20' : ''}
                      ${!isSelected && !day.hasWorkout && day.isScheduled && isPast ? 'bg-destructive/20' : ''}
                      ${!isSelected && day.isRestDay ? 'bg-muted/30' : ''}
                      hover:bg-muted
                    `}
                  >
                    <span className={`text-sm font-medium ${isSelected ? '' : isToday ? 'text-primary' : ''}`}>
                      {dayNum}
                    </span>
                    
                    {/* Indicators */}
                    <div className="flex gap-0.5 mt-0.5">
                      {day.hasWorkout && (
                        <CheckCircle2 className={`h-3 w-3 ${isSelected ? 'text-primary-foreground' : 'text-green-500'}`} />
                      )}
                      {day.session?.gymVerified && (
                        <Trophy className={`h-3 w-3 ${isSelected ? 'text-primary-foreground' : 'text-yellow-500'}`} />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/20" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive/20" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted/30" />
            <span>Rest Day</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-3 w-3 text-yellow-500" />
            <span>Verified</span>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <Card className="animate-in slide-in-from-bottom-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {new Date(selectedDay.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDay.hasWorkout && selectedDay.session ? (
                <>
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Workout Completed</span>
                    {selectedDay.session.gymVerified && (
                      <span className="ml-auto flex items-center gap-1 text-yellow-500 text-sm">
                        <Trophy className="h-4 w-4" />
                        Gym Verified
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted rounded-lg p-2 text-center">
                      <p className="text-lg font-bold">{selectedDay.session.exercises}</p>
                      <p className="text-xs text-muted-foreground">Exercises</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2 text-center">
                      <p className="text-lg font-bold">{selectedDay.session.duration}</p>
                      <p className="text-xs text-muted-foreground">Minutes</p>
                    </div>
                    <div className="bg-muted rounded-lg p-2 text-center">
                      <p className="text-lg font-bold">{selectedDay.session.calories}</p>
                      <p className="text-xs text-muted-foreground">Calories</p>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/history?session=${selectedDay.session?.id}`)}
                  >
                    View Details
                  </Button>
                </>
              ) : selectedDay.isScheduled ? (
                <>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    <span className="font-medium">{selectedDay.scheduledWorkout || 'Workout Day'}</span>
                  </div>
                  
                  {new Date(selectedDay.date) >= new Date(today) ? (
                    <Button 
                      className="w-full"
                      onClick={() => router.push('/workout/start')}
                    >
                      Start Workout
                    </Button>
                  ) : (
                    <p className="text-sm text-destructive">Workout was missed</p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Rest Day - Recovery is important!</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
