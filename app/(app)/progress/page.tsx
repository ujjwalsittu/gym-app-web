'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import { Spinner } from '@/components/ui/spinner'
import { 
  TrendingDown, TrendingUp, Flame, Clock, 
  Dumbbell, Droplets, Target, Award
} from 'lucide-react'
import useSWR from 'swr'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ProgressPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [range, setRange] = useState('30')

  const { data, isLoading } = useSWR(
    user ? `/api/progress?range=${range}` : null,
    fetcher
  )

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const weightChange = data?.weight?.length >= 2
    ? (data.weight[data.weight.length - 1].weight - data.weight[0].weight).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur p-4">
        <h1 className="text-xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground">Track your fitness journey</p>
      </header>

      <main className="mx-auto max-w-lg space-y-6 p-4">
        {/* Range Selector */}
        <div className="flex gap-2">
          {['7', '30', '90'].map((r) => (
            <Button
              key={r}
              variant={range === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange(r)}
            >
              {r === '7' ? '1 Week' : r === '30' ? '1 Month' : '3 Months'}
            </Button>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm">Streak</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{data?.currentStreak || 0} days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span className="text-sm">Workouts</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{data?.totalStats?.workouts || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-chart-2" />
                <span className="text-sm">Total Time</span>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {Math.round((data?.totalStats?.minutes || 0) / 60)}h
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="h-4 w-4 text-chart-1" />
                <span className="text-sm">Calories</span>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {(data?.totalStats?.calories || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="weight" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="water">Water</TabsTrigger>
          </TabsList>

          {/* Weight Chart */}
          <TabsContent value="weight">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Weight Progress</CardTitle>
                  {weightChange && (
                    <div className={`flex items-center gap-1 text-sm ${
                      parseFloat(weightChange) < 0 ? 'text-green-500' : 'text-destructive'
                    }`}>
                      {parseFloat(weightChange) < 0 ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                      {Math.abs(parseFloat(weightChange))} kg
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {data?.weight?.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.weight}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis 
                          domain={['dataMin - 2', 'dataMax + 2']}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          labelFormatter={formatDate}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                        {data.targetWeight && (
                          <Line
                            type="monotone"
                            dataKey={() => data.targetWeight}
                            stroke="hsl(var(--chart-2))"
                            strokeDasharray="5 5"
                            strokeWidth={1}
                            dot={false}
                            name="Target"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-muted-foreground">
                    No weight data yet. Log your weight to see progress.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workouts Chart */}
          <TabsContent value="workouts">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Workout Minutes</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.workouts?.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.workouts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          labelFormatter={formatDate}
                        />
                        <Bar 
                          dataKey="minutes" 
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-muted-foreground">
                    No workout data yet. Complete workouts to see progress.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Volume Chart */}
          <TabsContent value="volume">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Training Volume</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.volume?.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.volume}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          labelFormatter={formatDate}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="hsl(var(--chart-3))"
                          fill="hsl(var(--chart-3) / 0.3)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-muted-foreground">
                    No volume data yet. Log exercises to see progress.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Water Chart */}
          <TabsContent value="water">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  Water Intake
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.water?.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.water}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          labelFormatter={formatDate}
                          formatter={(value: number) => [`${value} glasses`, 'Water']}
                        />
                        <Bar 
                          dataKey="glasses" 
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-muted-foreground">
                    No water data yet. Log your water intake to see progress.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Goals Progress */}
        {data?.startWeight && data?.targetWeight && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Start: {data.startWeight} kg</span>
                  <span>Target: {data.targetWeight} kg</span>
                </div>
                <div className="relative h-3 w-full rounded-full bg-secondary">
                  {(() => {
                    const current = data.weight?.length > 0 
                      ? data.weight[data.weight.length - 1].weight 
                      : data.startWeight
                    const total = Math.abs(data.startWeight - data.targetWeight)
                    const progress = Math.abs(data.startWeight - current)
                    const percentage = Math.min(100, (progress / total) * 100)
                    return (
                      <div 
                        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    )
                  })()}
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {data.weight?.length > 0 
                    ? `Current: ${data.weight[data.weight.length - 1].weight} kg`
                    : 'No weight logged yet'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
