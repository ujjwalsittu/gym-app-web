'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SetupAdminPage() {
  const router = useRouter()
  const [adminExists, setAdminExists] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          setAdminExists(true)
        }
      } catch {
        // Admin doesn't exist, continue
      } finally {
        setChecking(false)
      }
    }

    checkAdmin()
  }, [])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (adminExists) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-lg text-muted-foreground">Page Not Found</p>
          <p className="text-sm text-muted-foreground">Admin account already exists. This setup page is no longer available.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return null
}
