'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'

export function PushNotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Register service worker and subscribe to push notifications
    const registerServiceWorker = async () => {
      try {
        if (!('serviceWorker' in navigator)) {
          console.log('[v0] Service Workers not supported')
          return
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log('[v0] Service Worker registered:', registration)

        // Get VAPID key
        const vapidResponse = await fetch('/api/push/vapid-key')
        if (!vapidResponse.ok) {
          console.error('[v0] Failed to get VAPID key')
          return
        }

        const { vapidPublicKey } = await vapidResponse.json()

        // Check notification permission and subscribe if needed
        if (Notification.permission === 'granted') {
          await subscribeUserToPush(registration, vapidPublicKey)
        }
      } catch (error) {
        console.error('[v0] Service Worker registration error:', error)
      }
    }

    registerServiceWorker()
  }, [user])

  return <>{children}</>
}

async function subscribeUserToPush(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
) {
  try {
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()

    if (existingSubscription) {
      console.log('[v0] Already subscribed to push notifications')
      return
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    console.log('[v0] Push subscription created:', subscription)

    // Send subscription to server
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    })

    if (!response.ok) {
      throw new Error('Failed to save subscription')
    }

    console.log('[v0] Subscription saved to server')
  } catch (error) {
    console.error('[v0] Push subscription error:', error)
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
