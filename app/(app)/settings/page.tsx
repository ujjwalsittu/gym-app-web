'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleResetProfile = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/profile/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reset profile')
      }

      setSuccess('Profile reset successfully. Redirecting to onboarding...')
      setShowResetDialog(false)
      
      // Redirect to onboarding after a brief delay
      setTimeout(() => {
        router.push('/onboarding')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProfile = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete profile')
      }

      setSuccess('Profile deleted successfully. Logging out...')
      setShowDeleteDialog(false)
      
      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and profile</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Reset Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset Profile
            </CardTitle>
            <CardDescription>
              Start your fitness journey from the beginning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Resetting your profile will:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Clear all your onboarding data</li>
              <li>Reset your fitness goals and preferences</li>
              <li>Keep your account active</li>
              <li>Take you back to the onboarding flow</li>
            </ul>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(true)}
              disabled={isLoading}
              className="mt-4"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Profile
            </Button>
          </CardContent>
        </Card>

        {/* Delete Profile Card */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Profile
            </CardTitle>
            <CardDescription>
              Permanently delete your account and data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. All your data will be permanently deleted.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Deleting your profile will:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Permanently delete your account</li>
              <li>Remove all your personal data</li>
              <li>Delete your workout history</li>
              <li>Remove your profile photos</li>
              <li>Log you out immediately</li>
            </ul>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
              className="mt-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Your Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all your onboarding data and take you back to the beginning. Your account will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 my-4">
            <p className="text-sm text-yellow-800">
              You&apos;ll need to complete the onboarding process again to set up your fitness goals.
            </p>
          </div>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleResetProfile}
            disabled={isLoading}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isLoading ? 'Resetting...' : 'Reset Profile'}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Your Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-50 border border-red-200 rounded p-3 my-4">
            <p className="text-sm text-red-800 font-semibold">
              Are you absolutely sure? This will:
            </p>
            <ul className="text-sm text-red-800 mt-2 space-y-1 list-disc list-inside">
              <li>Delete your account permanently</li>
              <li>Remove all your personal data</li>
              <li>Delete your entire workout history</li>
              <li>Remove all your uploaded photos</li>
            </ul>
          </div>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteProfile}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete My Account'}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
