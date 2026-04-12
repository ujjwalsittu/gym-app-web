'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { GymVerification } from '@/components/workout/gym-verification'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'
import { useEffect } from 'react'

export default function VerifyPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <GymVerification
        onVerified={() => router.push('/workout/start')}
        onSkip={() => router.push('/workout/start')}
        required={false}
      />
    </div>
  )
}
