'use client'

import { useEffect } from 'react'
import { ArrowLeft, Trophy, Lock, Star, Flame, Dumbbell, Target, Award, Zap, Medal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const categoryIcons: Record<string, any> = {
  workout: Dumbbell,
  streak: Flame,
  strength: Target,
  milestone: Trophy,
  special: Star
}

const categoryColors: Record<string, string> = {
  workout: 'text-blue-500',
  streak: 'text-orange-500',
  strength: 'text-green-500',
  milestone: 'text-yellow-500',
  special: 'text-purple-500'
}

export default function AchievementsPage() {
  const { data, isLoading, mutate } = useSWR('/api/achievements', fetcher)

  // Check for new achievements on load
  useEffect(() => {
    fetch('/api/achievements', { method: 'POST' })
      .then(() => mutate())
      .catch(console.error)
  }, [mutate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const { achievements = [], earnedPoints = 0, totalPoints = 0, unlockedCount = 0, totalCount = 0 } = data || {}

  // Group by category
  const groupedAchievements = achievements.reduce((acc: Record<string, any[]>, a: any) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Achievements</h1>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Points Overview */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{earnedPoints}</p>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{unlockedCount}/{totalCount}</p>
                <p className="text-sm text-muted-foreground">Unlocked</p>
              </div>
            </div>
            <Progress value={(earnedPoints / totalPoints) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {totalPoints - earnedPoints} points remaining
            </p>
          </CardContent>
        </Card>

        {/* Achievement Categories */}
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
          const Icon = categoryIcons[category] || Award
          const colorClass = categoryColors[category] || 'text-primary'
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${colorClass}`} />
                <h2 className="text-lg font-semibold capitalize">{category}</h2>
                <Badge variant="secondary" className="ml-auto">
                  {categoryAchievements.filter((a: any) => a.is_unlocked).length}/{categoryAchievements.length}
                </Badge>
              </div>

              <div className="grid gap-3">
                {categoryAchievements.map((achievement: any) => (
                  <Card 
                    key={achievement.id} 
                    className={`bg-card ${achievement.is_unlocked ? '' : 'opacity-60'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          achievement.is_unlocked 
                            ? 'bg-primary/20' 
                            : 'bg-muted'
                        }`}>
                          {achievement.is_unlocked ? (
                            <span className="text-2xl">{achievement.icon}</span>
                          ) : (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{achievement.name}</h3>
                            {achievement.is_unlocked && (
                              <Zap className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          {achievement.is_unlocked && achievement.unlocked_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold">{achievement.points}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}

        {/* Empty State */}
        {achievements.length === 0 && (
          <Card className="bg-card">
            <CardContent className="p-8 text-center">
              <Medal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No achievements available yet</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
