'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function LottieUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error'
    message: string
    details?: string
  }>({ type: 'idle', message: '' })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile)
        setStatus({ type: 'idle', message: '' })
      } else {
        setStatus({
          type: 'error',
          message: 'Please select a ZIP file'
        })
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a file' })
      return
    }

    setLoading(true)
    setStatus({ type: 'loading', message: 'Processing and uploading Lottie files...' })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/lottie-upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus({
          type: 'error',
          message: data.error || 'Upload failed',
          details: data.details
        })
      } else {
        setStatus({
          type: 'success',
          message: `Successfully uploaded ${data.count} exercises`,
          details: `Categories: ${data.summary.categories.join(', ')}`
        })
        setFile(null)
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Upload error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Upload Lottie Animations</h1>
        <p className="text-muted-foreground mb-6">
          Upload a ZIP file containing Lottie animations organized by: Gender/Equipment/BodyPart/animation.json
        </p>

        <Card className="p-6">
          <div className="space-y-6">
            {/* File Input */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <label htmlFor="file-input" className="cursor-pointer">
                <p className="text-lg font-semibold">Choose ZIP file</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {file ? file.name : 'Select a ZIP file with Lottie animations'}
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>

            {/* Expected Structure */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">Expected ZIP Structure:</p>
              <pre className="text-xs overflow-auto">
{`Men/
├── Barbell/
│   ├── Chest/
│   │   ├── bench-press.json
│   │   └── incline-press.json
│   └── Back/
│       └── barbell-row.json
├── Dumbbell/
│   └── Arms/
│       ├── bicep-curl.json
│       └── tricep-extension.json
Women/
├── Cable/
│   ├── Legs/
│   │   └── leg-press.json
│   └── Shoulders/
│       └── lateral-raise.json
└── Bodyweight/
    └── ABS/
        └── plank.json`}
              </pre>
            </div>

            {/* Status Messages */}
            {status.type !== 'idle' && (
              <div className={`p-4 rounded-lg flex gap-3 ${
                status.type === 'success' ? 'bg-green-50' : 
                status.type === 'error' ? 'bg-red-50' :
                'bg-blue-50'
              }`}>
                {status.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                {status.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                {status.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                <div>
                  <p className={`font-semibold ${
                    status.type === 'success' ? 'text-green-900' :
                    status.type === 'error' ? 'text-red-900' :
                    'text-blue-900'
                  }`}>
                    {status.message}
                  </p>
                  {status.details && (
                    <p className={`text-sm mt-1 ${
                      status.type === 'success' ? 'text-green-800' :
                      status.type === 'error' ? 'text-red-800' :
                      'text-blue-800'
                    }`}>
                      {status.details}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload ZIP
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Note:</span> Files will be extracted and uploaded to Vercel Blob. Lottie JSON files will be stored in the database and linked to exercises.
          </p>
        </div>
      </div>
    </div>
  )
}
