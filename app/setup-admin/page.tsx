'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const createAdmin = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ujjwal@azeonics.com',
          password: 'Sagar@4343',
          name: 'Admin User'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create admin user')
      } else {
        setResult(data.user)
      }
    } catch (err) {
      setError('Error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Admin User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <div className="space-y-3">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Admin user created successfully!
                </AlertDescription>
              </Alert>
              <div className="bg-muted p-3 rounded text-sm space-y-1">
                <p><strong>ID:</strong> {result.id}</p>
                <p><strong>Email:</strong> {result.email}</p>
                <p><strong>Name:</strong> {result.name}</p>
                <p><strong>Is Admin:</strong> {result.is_admin ? 'Yes' : 'No'}</p>
              </div>
              <Button onClick={() => window.location.href = '/'} className="w-full">
                Go to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <div className="bg-muted p-3 rounded text-sm space-y-2">
                <p><strong>Email:</strong> ujjwal@azeonics.com</p>
                <p><strong>Password:</strong> Sagar@4343</p>
              </div>
              <Button 
                onClick={createAdmin} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Admin User'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
