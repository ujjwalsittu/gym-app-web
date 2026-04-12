'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Flame, Clock, Calendar, Target } from 'lucide-react'

interface StatsCardsProps {
  weeklyStats: {
    workoutDays: number
    totalMinutes: number
    totalCalories: number
  }
  profile: {
    primaryGoal: string
    workoutDaysPerWeek: number
    weight: number
    targetWeight: number | null
  } | null
}

export function StatsCards({ weeklyStats, profile }: StatsCardsProps) {
  const stats = [
    {
      icon: Calendar,
      label: 'Workouts',
      value: weeklyStats.workoutDays,
      suffix: `/ ${profile?.workoutDaysPerWeek || 4}`,
      color: 'text-primary'
    },
    {
      icon: Clock,
      label: 'Minutes',
      value: weeklyStats.totalMinutes,
      suffix: 'min',
      color: 'text-blue-400'
    },
    {
      icon: Flame,
      label: 'Calories',
      value: weeklyStats.totalCalories,
      suffix: 'kcal',
      color: 'text-orange-400'
    },
    {
      icon: Target,
      label: 'Goal',
      value: profile?.targetWeight ? `${profile.targetWeight}` : '-',
      suffix: 'kg',
      color: 'text-green-400'
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{stat.value}</span>
                    <span className="text-sm text-muted-foreground">{stat.suffix}</span>
                  </div>
                </div>
                <div className={`rounded-lg bg-secondary p-2 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
