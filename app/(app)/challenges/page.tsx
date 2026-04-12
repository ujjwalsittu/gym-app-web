'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import { 
  Trophy,
  Flame,
  Target,
  Users,
  Calendar,
  ChevronRight,
  Medal,
  Crown,
  Zap,
  Dumbbell,
  Clock,
  CheckCircle2
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Challenge {
  id: string
  name: string
  description: string
  type: string
  target_value: number
  start_date: string
  end_date: string
  reward_points: number
  joined_at?: string
  progress?: number
  completed?: boolean
}

const CHALLENGE_ICONS: Record<string, React.ElementType> = {
  workout_count: Dumbbell,
  streak: Flame,
  calories: Zap,
  volume: Target,
  time: Clock
}

export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard'>('challenges')
  const [leaderboardType, setLeaderboardType] = useState('streak')
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('weekly')
  const [joiningChallenge, setJoiningChallenge] = useState<string | null>(null)

  const { data: challengesData, isLoading: loadingChallenges } = useSWR(
    '/api/challenges',
    fetcher
  )

  const { data: leaderboardData, isLoading: loadingLeaderboard } = useSWR(
    `/api/leaderboard?type=${leaderboardType}&period=${leaderboardPeriod}`,
    fetcher
  )

  const joinChallenge = async (challengeId: string) => {
    setJoiningChallenge(challengeId)
    try {
      await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId })
      })
      mutate('/api/challenges')
    } catch (error) {
      console.error('Failed to join challenge:', error)
    }
    setJoiningChallenge(null)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getDaysLeft = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const getProgressPercent = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Challenges</h1>
            <Trophy className="h-6 w-6 text-primary" />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'challenges' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('challenges')}
              className="flex-1"
            >
              <Target className="h-4 w-4 mr-2" />
              Challenges
            </Button>
            <Button
              variant={activeTab === 'leaderboard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('leaderboard')}
              className="flex-1"
            >
              <Medal className="h-4 w-4 mr-2" />
              Leaderboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {activeTab === 'challenges' ? (
          <>
            {loadingChallenges ? (
              <div className="flex justify-center py-12">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <>
                {/* Active Challenges */}
                {challengesData?.challenges?.active?.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Flame className="h-5 w-5 text-primary" />
                      Active Challenges
                    </h2>
                    <div className="space-y-3">
                      {challengesData.challenges.active.map((challenge: Challenge) => {
                        const Icon = CHALLENGE_ICONS[challenge.type] || Target
                        const isJoined = !!challenge.joined_at
                        const progress = challenge.progress || 0
                        const progressPercent = getProgressPercent(progress, challenge.target_value)

                        return (
                          <Card key={challenge.id} className={challenge.completed ? 'border-green-500/50' : ''}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${challenge.completed ? 'bg-green-500/20' : 'bg-primary/10'}`}>
                                  <Icon className={`h-6 w-6 ${challenge.completed ? 'text-green-500' : 'text-primary'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h3 className="font-semibold">{challenge.name}</h3>
                                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                                    </div>
                                    {challenge.completed && (
                                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>{getDaysLeft(challenge.end_date)} days left</span>
                                    <span className="mx-1">|</span>
                                    <Trophy className="h-3 w-3" />
                                    <span>{challenge.reward_points} pts</span>
                                  </div>

                                  {isJoined && (
                                    <div className="mt-3">
                                      <div className="flex justify-between text-sm mb-1">
                                        <span>{progress} / {challenge.target_value}</span>
                                        <span>{Math.round(progressPercent)}%</span>
                                      </div>
                                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all ${challenge.completed ? 'bg-green-500' : 'bg-primary'}`}
                                          style={{ width: `${progressPercent}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {!isJoined && (
                                    <Button 
                                      size="sm" 
                                      className="mt-3"
                                      onClick={() => joinChallenge(challenge.id)}
                                      disabled={joiningChallenge === challenge.id}
                                    >
                                      {joiningChallenge === challenge.id ? (
                                        <Spinner className="h-4 w-4 mr-2" />
                                      ) : null}
                                      Join Challenge
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* Upcoming Challenges */}
                {challengesData?.challenges?.upcoming?.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      Coming Soon
                    </h2>
                    <div className="space-y-3">
                      {challengesData.challenges.upcoming.map((challenge: Challenge) => {
                        const Icon = CHALLENGE_ICONS[challenge.type] || Target

                        return (
                          <Card key={challenge.id} className="opacity-75">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                  <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium">{challenge.name}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    Starts {formatDate(challenge.start_date)}
                                  </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* Completed Challenges */}
                {challengesData?.challenges?.completed?.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Completed
                    </h2>
                    <div className="space-y-2">
                      {challengesData.challenges.completed.map((challenge: Challenge) => (
                        <Card key={challenge.id} className="bg-green-500/5 border-green-500/20">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{challenge.name}</span>
                              <span className="text-sm text-green-500">+{challenge.reward_points} pts</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {!challengesData?.challenges?.active?.length && 
                 !challengesData?.challenges?.upcoming?.length && (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No challenges available</p>
                    <p className="text-sm text-muted-foreground">Check back soon for new challenges!</p>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* Leaderboard Filters */}
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { value: 'streak', label: 'Streak', icon: Flame },
                  { value: 'workouts', label: 'Workouts', icon: Dumbbell },
                  { value: 'calories', label: 'Calories', icon: Zap },
                  { value: 'volume', label: 'Volume', icon: Target }
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={leaderboardType === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLeaderboardType(value)}
                    className="flex-shrink-0"
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                {['weekly', 'monthly', 'alltime'].map((period) => (
                  <Button
                    key={period}
                    variant={leaderboardPeriod === period ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setLeaderboardPeriod(period)}
                    className="flex-1 capitalize"
                  >
                    {period === 'alltime' ? 'All Time' : period}
                  </Button>
                ))}
              </div>
            </div>

            {/* User Rank Card */}
            {leaderboardData?.userRank && (
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-primary">#{leaderboardData.userRank}</div>
                    <div>
                      <p className="font-medium">Your Rank</p>
                      <p className="text-sm text-muted-foreground">Keep pushing!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            {loadingLeaderboard ? (
              <div className="flex justify-center py-12">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Medal className="h-5 w-5 text-primary" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {leaderboardData?.leaderboard?.map((entry: { id: string, name: string, email: string, score: number, rank: number }, index: number) => {
                      const isCurrentUser = entry.id === leaderboardData.userId
                      
                      return (
                        <div 
                          key={entry.id}
                          className={`flex items-center gap-3 p-4 ${isCurrentUser ? 'bg-primary/5' : ''}`}
                        >
                          <div className="w-8 text-center">
                            {index === 0 ? (
                              <Crown className="h-6 w-6 text-yellow-500 mx-auto" />
                            ) : index === 1 ? (
                              <Medal className="h-6 w-6 text-gray-400 mx-auto" />
                            ) : index === 2 ? (
                              <Medal className="h-6 w-6 text-amber-600 mx-auto" />
                            ) : (
                              <span className="text-lg font-bold text-muted-foreground">{entry.rank}</span>
                            )}
                          </div>
                          
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">
                              {entry.name?.charAt(0) || entry.email?.charAt(0) || '?'}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                              {entry.name || entry.email?.split('@')[0] || 'Anonymous'}
                              {isCurrentUser && ' (You)'}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold">
                              {entry.score.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {leaderboardType === 'streak' ? 'days' : 
                               leaderboardType === 'calories' ? 'cal' :
                               leaderboardType === 'volume' ? 'lbs' : ''}
                            </p>
                          </div>
                        </div>
                      )
                    })}

                    {!leaderboardData?.leaderboard?.length && (
                      <div className="p-8 text-center">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No data yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
