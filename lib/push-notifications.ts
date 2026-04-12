// Client-side push notification utilities

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered:', registration.scope)
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) {
    console.log('Push notifications not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      return subscription
    }

    // Get VAPID public key from server
    const response = await fetch('/api/push/vapid-key')
    const { publicKey } = await response.json()

    // Subscribe to push
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    })

    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    })

    return subscription
  } catch (error) {
    console.error('Push subscription failed:', error)
    return null
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      // Unsubscribe locally
      await subscription.unsubscribe()
      
      // Remove from server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      })
      
      return true
    }
    
    return false
  } catch (error) {
    console.error('Push unsubscribe failed:', error)
    return false
  }
}

export async function checkNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.requestPermission()
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Reminder types
export interface ReminderSettings {
  waterReminder: boolean
  waterInterval: number // minutes
  workoutReminder: boolean
  workoutTime: string // HH:MM
  walkReminder: boolean
  walkInterval: number // hours
  mealReminders: boolean
  mealTimes: string[] // HH:MM array
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  waterReminder: true,
  waterInterval: 60,
  workoutReminder: true,
  workoutTime: '07:00',
  walkReminder: true,
  walkInterval: 2,
  mealReminders: true,
  mealTimes: ['08:00', '13:00', '19:00']
}
