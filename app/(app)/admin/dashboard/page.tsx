'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Dumbbell, Activity, Image, Loader2 } from 'lucide-react'
import { AdminNav } from '@/components/admin/nav'

interface AdminStats {
  totalUsers: number
  totalAdmins: number
  totalExercises: number
  exercisesWithAnimations: number
  totalWorkouts: number
  totalPhotos: number
  recentUsersCount: number
  activeUsers: number
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

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

    fetchStats()
  }, [])

  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user?.isAdmin) {
    return null
  }

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats?.totalUsers || 0, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { icon: Users, label: 'Admins', value: stats?.totalAdmins || 0, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: Dumbbell, label: 'Exercises', value: stats?.totalExercises || 0, color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: Dumbbell, label: 'With Animations', value: stats?.exercisesWithAnimations || 0, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    { icon: Activity, label: 'Total Workouts', value: stats?.totalWorkouts || 0, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { icon: Image, label: 'Body Photos', value: stats?.totalPhotos || 0, color: 'text-pink-600', bgColor: 'bg-pink-100' },
    { icon: Users, label: 'New Users (7d)', value: stats?.recentUsersCount || 0, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    { icon: Activity, label: 'Active Users', value: stats?.activeUsers || 0, color: 'text-indigo-600', bgColor: 'bg-indigo-100' }
  ]

  return (
    <div className="space-y-6">
      <AdminNav />
      
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/users">Manage Users</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/exercises">View Exercises</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/lottie-manage">Upload Lottie</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
