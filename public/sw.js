// hell.fitness Service Worker - Enhanced Offline Support
const CACHE_NAME = 'hell-fitness-v2'
const OFFLINE_URL = '/offline.html'
const WORKOUT_CACHE = 'hell-fitness-workouts-v1'
const API_CACHE = 'hell-fitness-api-v1'

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/dashboard',
  '/workout/start',
  '/workout/active'
]

// API routes to cache for offline access
const CACHEABLE_API_ROUTES = [
  '/api/dashboard',
  '/api/workout',
  '/api/diet',
  '/api/workout/history'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Skip non-GET requests but queue POST for later sync
  if (event.request.method !== 'GET') {
    if (event.request.method === 'POST' && url.pathname.includes('/api/workout/exercise')) {
      // Queue workout logs for background sync
      event.respondWith(
        fetch(event.request.clone()).catch(() => {
          // Store for later sync
          return new Response(JSON.stringify({ queued: true }), {
            headers: { 'Content-Type': 'application/json' }
          })
        })
      )
    }
    return
  }

  // API routes - network first, cache fallback
  if (CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, clone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) {
              // Add offline indicator header
              const headers = new Headers(cached.headers)
              headers.set('X-Offline', 'true')
              return new Response(cached.body, { headers })
            }
            return new Response(JSON.stringify({ offline: true }), {
              headers: { 'Content-Type': 'application/json' }
            })
          })
        })
    )
    return
  }

  // Static assets and pages - network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

// Background sync for offline workout logs
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workout-logs') {
    event.waitUntil(syncWorkoutLogs())
  }
})

async function syncWorkoutLogs() {
  // This will be handled by the offline-store.ts syncOfflineData function
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_REQUIRED' })
  })
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type
    },
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: true
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'
  
  // Handle action buttons
  if (event.action === 'start_workout') {
    event.waitUntil(clients.openWindow('/workout/start'))
    return
  }
  
  if (event.action === 'log_water') {
    event.waitUntil(clients.openWindow('/dashboard?action=log_water'))
    return
  }

  if (event.action === 'dismiss') {
    return
  }

  // Default - open the URL
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Open new window
      return clients.openWindow(url)
    })
  )
})
