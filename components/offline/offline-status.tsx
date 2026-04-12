'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Download, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  isOnline, 
  getPendingActions, 
  syncPendingActions, 
  getOfflineStats,
  downloadWorkoutsForOffline,
  cacheExerciseLibrary
} from '@/lib/offline-manager'

interface OfflineStatusProps {
  showDetails?: boolean
  userId?: string
}

export function OfflineStatus({ showDetails = false, userId }: OfflineStatusProps) {
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [stats, setStats] = useState({ workouts: 0, exercises: 0, pendingActions: 0, cachedResponses: 0 })
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // Check online status
    setOnline(isOnline())

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load pending actions count
    loadPendingCount()

    // Load stats if showing details
    if (showDetails) {
      loadStats()
    }

    // Auto-sync when coming online
    const syncInterval = setInterval(() => {
      if (isOnline()) {
        autoSync()
      }
    }, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(syncInterval)
    }
  }, [showDetails])

  const loadPendingCount = async () => {
    const pending = await getPendingActions()
    setPendingCount(pending.length)
  }

  const loadStats = async () => {
    const offlineStats = await getOfflineStats()
    setStats(offlineStats)
  }

  const autoSync = async () => {
    if (pendingCount > 0 && !syncing) {
      await handleSync()
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await syncPendingActions()
      setPendingCount(result.remaining)
      setLastSync(new Date())
      if (showDetails) {
        loadStats()
      }
    } finally {
      setSyncing(false)
    }
  }

  const handleDownloadWorkouts = async () => {
    if (!userId) return
    setDownloading(true)
    try {
      await downloadWorkoutsForOffline(userId, 7)
      await cacheExerciseLibrary()
      if (showDetails) {
        loadStats()
      }
    } finally {
      setDownloading(false)
    }
  }

  // Minimal indicator
  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        {online ? (
          <div className="flex items-center gap-1.5 text-xs text-green-500">
            <Wifi className="h-3.5 w-3.5" />
            <span>Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-yellow-500">
            <WifiOff className="h-3.5 w-3.5" />
            <span>Offline</span>
          </div>
        )}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Cloud className="h-3.5 w-3.5" />
            <span>{pendingCount} pending</span>
          </div>
        )}
      </div>
    )
  }

  // Detailed view
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Offline Status</h3>
        {online ? (
          <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-500">
            <Wifi className="h-3.5 w-3.5" />
            <span>Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs text-yellow-500">
            <WifiOff className="h-3.5 w-3.5" />
            <span>Offline Mode</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">Cached Workouts</p>
          <p className="text-xl font-bold">{stats.workouts}</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">Cached Exercises</p>
          <p className="text-xl font-bold">{stats.exercises}</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">Pending Sync</p>
          <p className="text-xl font-bold">{stats.pendingActions}</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">API Cache</p>
          <p className="text-xl font-bold">{stats.cachedResponses}</p>
        </div>
      </div>

      {lastSync && (
        <p className="text-xs text-muted-foreground">
          Last synced: {lastSync.toLocaleTimeString()}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleDownloadWorkouts}
          disabled={downloading || !online}
        >
          {downloading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download Week
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleSync}
          disabled={syncing || !online || pendingCount === 0}
        >
          {syncing ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : pendingCount === 0 ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Cloud className="mr-2 h-4 w-4" />
          )}
          {pendingCount > 0 ? `Sync (${pendingCount})` : 'Synced'}
        </Button>
      </div>

      {!online && (
        <div className="rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-500">
          <p className="font-medium">Offline Mode Active</p>
          <p className="text-xs opacity-80">
            Your workouts will be saved locally and synced when you&apos;re back online.
          </p>
        </div>
      )}
    </div>
  )
}
