'use client'

import { openDB, DBSchema, IDBPDatabase } from 'idb'

// Database schema for offline storage
interface HellFitnessDB extends DBSchema {
  workouts: {
    key: string
    value: {
      id: string
      userId: string
      planData: any
      exercises: any[]
      downloadedAt: number
      expiresAt: number
    }
    indexes: { 'by-user': string; 'by-expiry': number }
  }
  exerciseLibrary: {
    key: string
    value: {
      id: string
      name: string
      category: string
      muscleGroup: string
      instructions: string[]
      tips: string[]
      animationData: any
      cachedAt: number
    }
    indexes: { 'by-category': string }
  }
  pendingLogs: {
    key: string
    value: {
      id: string
      type: 'exercise_log' | 'workout_session' | 'measurement' | 'journal' | 'photo'
      data: any
      createdAt: number
      retryCount: number
    }
    indexes: { 'by-type': string }
  }
  userPreferences: {
    key: string
    value: any
  }
  cachedResponses: {
    key: string
    value: {
      url: string
      data: any
      cachedAt: number
      expiresAt: number
    }
    indexes: { 'by-expiry': number }
  }
}

let dbInstance: IDBPDatabase<VisionaryFitDB> | null = null

// Initialize the database
export async function initOfflineDB(): Promise<IDBPDatabase<VisionaryFitDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<HellFitnessDB>('hell-fitness-offline', 2, {
    upgrade(db, oldVersion) {
      // Workouts store
      if (!db.objectStoreNames.contains('workouts')) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' })
        workoutStore.createIndex('by-user', 'userId')
        workoutStore.createIndex('by-expiry', 'expiresAt')
      }

      // Exercise library store
      if (!db.objectStoreNames.contains('exerciseLibrary')) {
        const exerciseStore = db.createObjectStore('exerciseLibrary', { keyPath: 'id' })
        exerciseStore.createIndex('by-category', 'category')
      }

      // Pending logs store
      if (!db.objectStoreNames.contains('pendingLogs')) {
        const logsStore = db.createObjectStore('pendingLogs', { keyPath: 'id' })
        logsStore.createIndex('by-type', 'type')
      }

      // User preferences store
      if (!db.objectStoreNames.contains('userPreferences')) {
        db.createObjectStore('userPreferences')
      }

      // Cached responses store
      if (!db.objectStoreNames.contains('cachedResponses')) {
        const cacheStore = db.createObjectStore('cachedResponses', { keyPath: 'url' })
        cacheStore.createIndex('by-expiry', 'expiresAt')
      }
    },
  })

  return dbInstance
}

// Check if we're online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// Download workouts for offline use
export async function downloadWorkoutsForOffline(userId: string, days: number = 7): Promise<{
  success: boolean
  downloaded: number
  error?: string
}> {
  try {
    const db = await initOfflineDB()
    
    // Fetch upcoming workouts from API
    const response = await fetch(`/api/workout/upcoming?days=${days}`)
    if (!response.ok) throw new Error('Failed to fetch workouts')
    
    const { workouts } = await response.json()
    
    // Store each workout
    const tx = db.transaction('workouts', 'readwrite')
    for (const workout of workouts) {
      await tx.store.put({
        id: workout.id || `workout-${workout.date}`,
        userId,
        planData: workout.plan,
        exercises: workout.exercises,
        downloadedAt: Date.now(),
        expiresAt: Date.now() + (days * 24 * 60 * 60 * 1000),
      })
    }
    await tx.done

    return { success: true, downloaded: workouts.length }
  } catch (error) {
    return { 
      success: false, 
      downloaded: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Get offline workout for a specific date
export async function getOfflineWorkout(date: string): Promise<any | null> {
  try {
    const db = await initOfflineDB()
    const workout = await db.get('workouts', `workout-${date}`)
    return workout || null
  } catch {
    return null
  }
}

// Cache exercise library for offline use
export async function cacheExerciseLibrary(): Promise<{ success: boolean; cached: number }> {
  try {
    const db = await initOfflineDB()
    
    // Fetch all exercises
    const response = await fetch('/api/exercises?all=true')
    if (!response.ok) throw new Error('Failed to fetch exercises')
    
    const { exercises } = await response.json()
    
    // Store each exercise
    const tx = db.transaction('exerciseLibrary', 'readwrite')
    for (const exercise of exercises) {
      await tx.store.put({
        ...exercise,
        cachedAt: Date.now(),
      })
    }
    await tx.done

    return { success: true, cached: exercises.length }
  } catch {
    return { success: false, cached: 0 }
  }
}

// Get exercises from offline cache
export async function getOfflineExercises(category?: string): Promise<any[]> {
  try {
    const db = await initOfflineDB()
    
    if (category) {
      return await db.getAllFromIndex('exerciseLibrary', 'by-category', category)
    }
    
    return await db.getAll('exerciseLibrary')
  } catch {
    return []
  }
}

// Queue an action for later sync
export async function queueOfflineAction(
  type: 'exercise_log' | 'workout_session' | 'measurement' | 'journal' | 'photo',
  data: any
): Promise<string> {
  const db = await initOfflineDB()
  const id = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  await db.put('pendingLogs', {
    id,
    type,
    data,
    createdAt: Date.now(),
    retryCount: 0,
  })
  
  return id
}

// Get all pending actions
export async function getPendingActions(): Promise<any[]> {
  try {
    const db = await initOfflineDB()
    return await db.getAll('pendingLogs')
  } catch {
    return []
  }
}

// Sync pending actions to server
export async function syncPendingActions(): Promise<{
  synced: number
  failed: number
  remaining: number
}> {
  const db = await initOfflineDB()
  const pending = await db.getAll('pendingLogs')
  
  let synced = 0
  let failed = 0
  
  for (const action of pending) {
    try {
      let endpoint = ''
      switch (action.type) {
        case 'exercise_log':
          endpoint = '/api/workout/exercise'
          break
        case 'workout_session':
          endpoint = '/api/workout'
          break
        case 'measurement':
          endpoint = '/api/measurements'
          break
        case 'journal':
          endpoint = '/api/journal'
          break
        case 'photo':
          endpoint = '/api/upload/photo'
          break
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.data),
      })
      
      if (response.ok) {
        await db.delete('pendingLogs', action.id)
        synced++
      } else {
        // Update retry count
        action.retryCount++
        if (action.retryCount >= 5) {
          // Give up after 5 retries
          await db.delete('pendingLogs', action.id)
        } else {
          await db.put('pendingLogs', action)
        }
        failed++
      }
    } catch {
      failed++
    }
  }
  
  const remaining = (await db.getAll('pendingLogs')).length
  
  return { synced, failed, remaining }
}

// Cache API response
export async function cacheResponse(url: string, data: any, ttlMinutes: number = 60): Promise<void> {
  const db = await initOfflineDB()
  await db.put('cachedResponses', {
    url,
    data,
    cachedAt: Date.now(),
    expiresAt: Date.now() + (ttlMinutes * 60 * 1000),
  })
}

// Get cached response
export async function getCachedResponse(url: string): Promise<any | null> {
  try {
    const db = await initOfflineDB()
    const cached = await db.get('cachedResponses', url)
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }
    
    // Clean up expired cache
    if (cached) {
      await db.delete('cachedResponses', url)
    }
    
    return null
  } catch {
    return null
  }
}

// Clear expired data
export async function cleanupExpiredData(): Promise<void> {
  const db = await initOfflineDB()
  const now = Date.now()
  
  // Clean expired workouts
  const workouts = await db.getAllFromIndex('workouts', 'by-expiry')
  for (const workout of workouts) {
    if (workout.expiresAt < now) {
      await db.delete('workouts', workout.id)
    }
  }
  
  // Clean expired cache
  const cached = await db.getAllFromIndex('cachedResponses', 'by-expiry')
  for (const item of cached) {
    if (item.expiresAt < now) {
      await db.delete('cachedResponses', item.url)
    }
  }
}

// Get offline storage stats
export async function getOfflineStats(): Promise<{
  workouts: number
  exercises: number
  pendingActions: number
  cachedResponses: number
}> {
  try {
    const db = await initOfflineDB()
    
    return {
      workouts: await db.count('workouts'),
      exercises: await db.count('exerciseLibrary'),
      pendingActions: await db.count('pendingLogs'),
      cachedResponses: await db.count('cachedResponses'),
    }
  } catch {
    return { workouts: 0, exercises: 0, pendingActions: 0, cachedResponses: 0 }
  }
}

// Save user preference
export async function savePreference(key: string, value: any): Promise<void> {
  const db = await initOfflineDB()
  await db.put('userPreferences', value, key)
}

// Get user preference
export async function getPreference<T>(key: string): Promise<T | null> {
  try {
    const db = await initOfflineDB()
    return await db.get('userPreferences', key) as T | null
  } catch {
    return null
  }
}
