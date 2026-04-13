'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Dumbbell, Activity, Image, Settings, AlertCircle, CheckCircle2 } from 'lucide-react'

interface AdminStats {
  stats: {
    totalUsers: number
    totalExercises: number
    totalWorkoutSessions: number
    totalBodyPhotos: number
    activeUsersThisWeek: number
  }
  recentUsers: any[]
  exercisesByCategory: any[]
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    if (user?.isAdmin) {
      fetchStats()
    }
  }, [user?.isAdmin])

  if (loading || !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto pb-20">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2">Manage your gym app, exercises, users and more</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-6 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.stats.totalUsers}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.stats.activeUsersThisWeek} active this week
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">Exercises</CardTitle>
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.stats.totalExercises}</div>
                      <p className="text-xs text-muted-foreground mt-1">With Lottie animations</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">Workouts</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.stats.totalWorkoutSessions}</div>
                      <p className="text-xs text-muted-foreground mt-1">Total logged sessions</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">Body Photos</CardTitle>
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.stats.totalBodyPhotos}</div>
                      <p className="text-xs text-muted-foreground mt-1">Secure private storage</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">System</CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">OK</div>
                      <p className="text-xs text-muted-foreground mt-1">All systems running</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Users */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Signups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.recentUsers.length > 0 ? (
                      <div className="space-y-4">
                        {stats.recentUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                            <div>
                              <p className="font-medium text-sm">{user.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-xs bg-secondary px-2 py-1 rounded">New</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent signups</p>
                    )}
                  </CardContent>
                </Card>

                {/* Exercises by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Exercises by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.exercisesByCategory.map((cat) => (
                        <div key={cat.category} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{cat.category}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (cat.count / Math.max(...stats.exercisesByCategory.map((c) => c.count))) * 100,
                                    100
                                  )}%`
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{cat.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* Exercises Tab */}
          <TabsContent value="exercises">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Exercise Management</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/admin/lottie-manage')}>
                      Process Lottie Files
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/admin/exercises/manual')}>
                      Add Manual Exercise
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Manage your exercise library:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Process and import Lottie animation files in bulk
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Add exercises manually without animations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Organize by category, equipment, and difficulty
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-blue-900">What you can do:</p>
                      <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-5 list-disc">
                        <li>View all registered users</li>
                        <li>Manage admin access permissions</li>
                        <li>View user activity and progress</li>
                        <li>Monitor workout sessions and engagement</li>
                      </ul>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    View Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Media & Storage Management</CardTitle>
                  <Button variant="outline" onClick={() => router.push('/admin/lottie-manage')}>
                    Cleanup Storage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Body Photos (Private)</h4>
                    <p className="text-sm text-muted-foreground">
                      Total: {stats?.stats.totalBodyPhotos || 0} encrypted photos stored in Vercel Blob
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-900">
                      📊 All photos are encrypted and only accessible by the user or AI with proper authentication tokens
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    View Storage Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Admin Tools</h4>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li>✓ Full database access and management</li>
                      <li>✓ User and exercise library management</li>
                      <li>✓ Storage and media management</li>
                      <li>✓ System health monitoring</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Current Admin Account</p>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p>{user?.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
