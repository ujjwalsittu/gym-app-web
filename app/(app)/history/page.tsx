'use client'

import { useState } from 'react'
import { ArrowLeft, Trophy, Clock, Flame, Dumbbell, TrendingUp, Calendar, ChevronRight, Medal, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState('workouts')
  const { data, isLoading } = useSWR('/api/workout/history', fetcher)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const { workouts = [], personalRecords = [], streak = {}, stats = {} } = data || {}

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Workout History</h1>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-bold">{streak.current_streak || 0} day streak</span>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card">
            <CardContent className="p-4 text-center">
              <Dumbbell className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total_workouts || 0}</p>
              <p className="text-xs text-muted-foreground">Total Workouts</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{Math.round(stats.total_minutes || 0)}</p>
              <p className="text-xs text-muted-foreground">Total Minutes</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{Math.round(stats.total_calories || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Calories Burned</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{personalRecords.length}</p>
              <p className="text-xs text-muted-foreground">Personal Records</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="workouts" className="flex-1">Workouts</TabsTrigger>
            <TabsTrigger value="prs" className="flex-1">Personal Records</TabsTrigger>
          </TabsList>

          <TabsContent value="workouts" className="space-y-3 mt-4">
            {workouts.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="p-8 text-center">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No workouts yet</p>
                  <Link href="/workout/start">
                    <Button className="mt-4">Start Your First Workout</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              workouts.map((workout: any) => (
                <Card key={workout.id} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold capitalize">{workout.day_of_week} Workout</h3>
                          {workout.gym_verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Medal className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(workout.started_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {workout.duration_minutes || 0} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-4 w-4 text-muted-foreground" />
                            {workout.exercise_count || 0} exercises
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="h-4 w-4 text-muted-foreground" />
                            {workout.calories_burned || 0} cal
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="prs" className="space-y-3 mt-4">
            {personalRecords.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No personal records yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete workouts to set your PRs!
                  </p>
                </CardContent>
              </Card>
            ) : (
              personalRecords.map((pr: any) => (
                <Card key={pr.id} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{pr.exercise_name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {pr.record_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {pr.value} {pr.unit}
                        </p>
                        {pr.previous_value && (
                          <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            +{pr.value - pr.previous_value} {pr.unit}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(pr.achieved_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
