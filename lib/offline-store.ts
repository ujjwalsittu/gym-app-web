// IndexedDB-based offline storage for workout plans and exercise data
// Enables full offline workout tracking when in low-network areas

const DB_NAME = 'visionaryfit_offline'
const DB_VERSION = 1

interface OfflineWorkoutPlan {
  id: string
  userId: string
  planData: any
  lastSynced: Date
}

interface OfflineExerciseLog {
  id: string
  sessionId: string
  exerciseName: string
  sets: number
  reps: number
  weight: number
  completedAt: Date
  synced: boolean
}

interface OfflineSession {
  id: string
  dayOfWeek: string
  startedAt: Date
  exercises: OfflineExerciseLog[]
  synced: boolean
}

class OfflineStore {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Workout plans store
        if (!db.objectStoreNames.contains('workoutPlans')) {
          const planStore = db.createObjectStore('workoutPlans', { keyPath: 'id' })
          planStore.createIndex('userId', 'userId', { unique: false })
        }

        // Exercise logs store (for offline logging)
        if (!db.objectStoreNames.contains('exerciseLogs')) {
          const logStore = db.createObjectStore('exerciseLogs', { keyPath: 'id' })
          logStore.createIndex('sessionId', 'sessionId', { unique: false })
          logStore.createIndex('synced', 'synced', { unique: false })
        }

        // Workout sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' })
          sessionStore.createIndex('synced', 'synced', { unique: false })
        }

        // Exercise library (for animations/instructions)
        if (!db.objectStoreNames.contains('exerciseLibrary')) {
          db.createObjectStore('exerciseLibrary', { keyPath: 'name' })
        }
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  // Save workout plan for offline use
  async saveWorkoutPlan(plan: OfflineWorkoutPlan): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('workoutPlans', 'readwrite')
      const store = tx.objectStore('workoutPlans')
      store.put(plan)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // Get workout plan
  async getWorkoutPlan(userId: string): Promise<OfflineWorkoutPlan | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('workoutPlans', 'readonly')
      const store = tx.objectStore('workoutPlans')
      const index = store.index('userId')
      const request = index.get(userId)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  // Save exercise log offline
  async saveExerciseLog(log: OfflineExerciseLog): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('exerciseLogs', 'readwrite')
      const store = tx.objectStore('exerciseLogs')
      store.put({ ...log, synced: false })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // Get unsynced logs
  async getUnsyncedLogs(): Promise<OfflineExerciseLog[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('exerciseLogs', 'readonly')
      const store = tx.objectStore('exerciseLogs')
      const index = store.index('synced')
      const request = index.getAll(false)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Mark logs as synced
  async markLogsSynced(logIds: string[]): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction('exerciseLogs', 'readwrite')
    const store = tx.objectStore('exerciseLogs')
    
    for (const id of logIds) {
      const request = store.get(id)
      request.onsuccess = () => {
        if (request.result) {
          store.put({ ...request.result, synced: true })
        }
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // Save exercise library for offline access
  async saveExerciseLibrary(exercises: any[]): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction('exerciseLibrary', 'readwrite')
    const store = tx.objectStore('exerciseLibrary')
    
    for (const exercise of exercises) {
      store.put(exercise)
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // Get exercise from library
  async getExercise(name: string): Promise<any | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('exerciseLibrary', 'readonly')
      const store = tx.objectStore('exerciseLibrary')
      const request = store.get(name)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  // Sync all offline data when back online
  async syncOfflineData(): Promise<{ synced: number; failed: number }> {
    const unsyncedLogs = await this.getUnsyncedLogs()
    let synced = 0
    let failed = 0

    for (const log of unsyncedLogs) {
      try {
        const response = await fetch('/api/workout/exercise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: log.sessionId,
            exerciseName: log.exerciseName,
            setsCompleted: log.sets,
            repsCompleted: log.reps,
            weightUsed: log.weight,
            offlineId: log.id
          })
        })

        if (response.ok) {
          await this.markLogsSynced([log.id])
          synced++
        } else {
          failed++
        }
      } catch (error) {
        failed++
      }
    }

    return { synced, failed }
  }
}

export const offlineStore = new OfflineStore()

// Hook for detecting online/offline status
export function useOnlineStatus() {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}
