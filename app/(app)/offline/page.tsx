'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Download, 
  Wifi, 
  WifiOff, 
  HardDrive, 
  Trash2, 
  RefreshCw,
  Check,
  AlertCircle,
  Dumbbell,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { OfflineStatus } from '@/components/offline/offline-status'
import { 
  isOnline, 
  downloadWorkoutsForOffline, 
  cacheExerciseLibrary,
  getOfflineStats,
  cleanupExpiredData,
  syncPendingActions,
  getPendingActions
} from '@/lib/offline-manager'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function OfflinePage() {
  const router = useRouter()
  const { data: session } = useSWR('/api/auth/session', fetcher)
  
  const [online, setOnline] = useState(true)
  const [stats, setStats] = useState({ workouts: 0, exercises: 0, pendingActions: 0, cachedResponses: 0 })
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setOnline(isOnline())
    loadStats()

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadStats = async () => {
    const offlineStats = await getOfflineStats()
    setStats(offlineStats)
  }

  const handleDownloadAll = async () => {
    if (!session?.user?.id) return
    
    setDownloading(true)
    setDownloadProgress(0)
    setMessage(null)

    try {
      // Download workouts (50% progress)
      setDownloadProgress(10)
      const workoutResult = await downloadWorkoutsForOffline(session.user.id, 7)
      setDownloadProgress(50)

      // Cache exercise library (100% progress)
      const exerciseResult = await cacheExerciseLibrary()
      setDownloadProgress(100)

      await loadStats()

      setMessage({
        type: 'success',
        text: `Downloaded ${workoutResult.downloaded} workouts and ${exerciseResult.cached} exercises for offline use!`
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to download data. Please try again.'
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)

    try {
      const result = await syncPendingActions()
      await loadStats()

      if (result.synced > 0) {
        setMessage({
          type: 'success',
          text: `Synced ${result.synced} actions. ${result.remaining} remaining.`
        })
      } else if (result.remaining === 0) {
        setMessage({
          type: 'success',
          text: 'All data is synced!'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Sync failed. Will retry automatically.'
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleClearCache = async () => {
    setClearing(true)
    setMessage(null)

    try {
      await cleanupExpiredData()
      await loadStats()
      setMessage({
        type: 'success',
        text: 'Expired cache cleared successfully!'
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to clear cache.'
      })
    } finally {
      setClearing(false)
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold">Offline Mode</h1>
            <p className="text-sm text-muted-foreground">Manage offline data</p>
          </div>
          <div className="flex items-center gap-2">
            {online ? (
              <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-sm text-green-500">
                <Wifi className="h-4 w-4" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1.5 text-sm text-yellow-500">
                <WifiOff className="h-4 w-4" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 rounded-lg p-3 ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-red-500/10 text-red-500'
          }`}>
            {message.type === 'success' ? (
              <Check className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Storage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Offline Storage
            </CardTitle>
            <CardDescription>
              Data cached for offline use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <Dumbbell className="mx-auto mb-1 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{stats.workouts}</p>
                <p className="text-xs text-muted-foreground">Workouts</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <BookOpen className="mx-auto mb-1 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{stats.exercises}</p>
                <p className="text-xs text-muted-foreground">Exercises</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Pre-Download for Gym
            </CardTitle>
            <CardDescription>
              Download your workouts before heading to the gym
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {downloading && (
              <div className="space-y-2">
                <Progress value={downloadProgress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground">
                  Downloading... {downloadProgress}%
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleDownloadAll}
              disabled={downloading || !online}
            >
              {downloading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download Next 7 Days
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Downloads workout plans, exercises, and animations
            </p>
          </CardContent>
        </Card>

        {/* Sync Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Pending Sync
            </CardTitle>
            <CardDescription>
              {stats.pendingActions} actions waiting to sync
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.pendingActions > 0 && (
              <div className="rounded-lg bg-yellow-500/10 p-3">
                <p className="text-sm text-yellow-500">
                  You have workout data that needs to be synced to the server.
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={handleSync}
              disabled={syncing || !online || stats.pendingActions === 0}
            >
              {syncing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : stats.pendingActions === 0 ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {stats.pendingActions > 0 ? `Sync Now (${stats.pendingActions})` : 'All Synced'}
            </Button>
          </CardContent>
        </Card>

        {/* Clear Cache */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Manage Storage
            </CardTitle>
            <CardDescription>
              Clear expired cached data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleClearCache}
              disabled={clearing}
            >
              {clearing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Clear Expired Cache
            </Button>
          </CardContent>
        </Card>

        {/* Offline Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Offline Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Before gym:</strong> Download your workouts while on WiFi
            </p>
            <p>
              <strong className="text-foreground">At gym:</strong> All your workouts and exercises work offline
            </p>
            <p>
              <strong className="text-foreground">After gym:</strong> Your workout logs sync automatically when online
            </p>
            <p>
              <strong className="text-foreground">Low signal:</strong> The app queues actions and retries automatically
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
