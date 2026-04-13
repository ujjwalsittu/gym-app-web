'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Trash2, Package } from 'lucide-react'

export default function LottieManagePage() {
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [zipPath, setZipPath] = useState('users/Archive.zip')

  const handleProcessLottie = async () => {
    setProcessing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/process-lottie-zip-blob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipPath })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to process ZIP')
        return
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setProcessing(false)
    }
  }

  const handleCleanupPhotos = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/cleanup-photos', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to cleanup photos')
        return
      }

      setResult({
        ...data,
        message: `Successfully deleted ${data.deleted} out of ${data.total} photos from blob storage`
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Lottie & Photos Management</h1>

      <div className="space-y-6">
        {/* Process Lottie ZIP */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Process Lottie ZIP File</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Extract and process Lottie animations from ZIP in blob storage. The structure should be:
            <br />
            <code className="bg-secondary px-2 py-1 rounded mt-2 block">Gender/Equipment/BodyPart/animation.json</code>
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ZIP Path in Blob Storage</label>
              <Input
                value={zipPath}
                onChange={(e) => setZipPath(e.target.value)}
                placeholder="e.g., users/Archive.zip"
                disabled={processing}
              />
            </div>

            <Button
              onClick={handleProcessLottie}
              disabled={processing}
              size="lg"
              className="w-full"
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {processing ? 'Processing ZIP...' : 'Process Lottie ZIP'}
            </Button>
          </div>
        </Card>

        {/* Cleanup Photos */}
        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h2 className="text-xl font-semibold">Clean Up Old User Photos</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete all old user photos from blob storage. This action cannot be undone.
          </p>

          <Button
            onClick={handleCleanupPhotos}
            disabled={loading}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? 'Deleting Photos...' : 'Delete All Old Photos'}
          </Button>
        </Card>

        {/* Results */}
        {result && (
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">✓ Operation Successful</h3>
            <div className="space-y-2 text-sm text-green-800">
              <p>{result.message}</p>
              {result.processed && (
                <p>Exercises processed: <strong>{result.processed}</strong></p>
              )}
              {result.skipped && (
                <p>Skipped: <strong>{result.skipped}</strong></p>
              )}
              {result.deleted && (
                <p>Photos deleted: <strong>{result.deleted}</strong> / <strong>{result.total}</strong></p>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="font-medium">Errors encountered:</p>
                  <ul className="list-disc pl-5 mt-1">
                    {result.errors.slice(0, 5).map((err: string, i: number) => (
                      <li key={i} className="text-xs">{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="p-6 bg-red-50 border-red-200">
            <h3 className="font-semibold text-red-900 mb-2">✗ Error</h3>
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
