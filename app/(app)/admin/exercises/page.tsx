'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, CheckCircle2, XCircle, Loader2, FileVideo, FolderOpen } from 'lucide-react'

interface UploadResult {
  success: boolean
  exerciseName: string
  category: string
  subcategory: string
  videoUrl?: string
  error?: string
}

export default function AdminExercisesPage() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<UploadResult[]>([])
  const [totalFiles, setTotalFiles] = useState(0)
  const [processedFiles, setProcessedFiles] = useState(0)
  const [currentFile, setCurrentFile] = useState('')

  const handleZipUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.zip')) {
      alert('Please upload a ZIP file')
      return
    }

    setUploading(true)
    setProgress(0)
    setResults([])
    setProcessedFiles(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/admin/exercises/upload-zip', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      // Stream the response for progress updates
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line)
                if (data.type === 'progress') {
                  setTotalFiles(data.total)
                  setProcessedFiles(data.processed)
                  setCurrentFile(data.currentFile)
                  setProgress((data.processed / data.total) * 100)
                } else if (data.type === 'result') {
                  setResults(prev => [...prev, data.result])
                } else if (data.type === 'complete') {
                  setProgress(100)
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload ZIP file. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [])

  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Exercise Video Manager</h1>
        <p className="text-muted-foreground">
          Upload a ZIP file containing exercise videos organized by category
        </p>
      </div>

      {/* Upload Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            ZIP Structure Requirements
          </CardTitle>
          <CardDescription>
            Organize your videos in this folder structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`exercises.zip
├── Upper Body/
│   ├── Chest/
│   │   ├── bench-press.mp4
│   │   ├── push-ups.mp4
│   │   └── dumbbell-fly.mp4
│   ├── Back/
│   │   ├── pull-ups.mp4
│   │   └── rows.mp4
│   └── Arms/
│       ├── bicep-curl.mp4
│       └── tricep-dips.mp4
├── Lower Body/
│   ├── Quads/
│   │   ├── squats.mp4
│   │   └── leg-press.mp4
│   └── Glutes/
│       └── lunges.mp4
├── Core/
│   ├── plank.mp4
│   └── crunches.mp4
└── Cardio/
    ├── jumping-jacks.mp4
    └── burpees.mp4`}
          </pre>
          <p className="text-sm text-muted-foreground mt-4">
            File names become exercise names (hyphens/underscores converted to spaces, e.g., &quot;bench-press.mp4&quot; becomes &quot;Bench Press&quot;)
          </p>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Exercise Videos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="zip-upload"
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                uploading
                  ? 'bg-muted border-muted-foreground/30 cursor-not-allowed'
                  : 'hover:bg-muted/50 border-muted-foreground/50'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploading ? (
                  <>
                    <Loader2 className="h-10 w-10 mb-3 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Processing videos...</p>
                  </>
                ) : (
                  <>
                    <FileVideo className="h-10 w-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">ZIP file containing MP4 videos</p>
                  </>
                )}
              </div>
              <input
                id="zip-upload"
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleZipUpload}
                disabled={uploading}
              />
            </label>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing: {currentFile}</span>
                <span>{processedFiles} / {totalFiles}</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Results Summary */}
          {results.length > 0 && (
            <div className="flex gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <span>{successCount} uploaded</span>
              </div>
              {failCount > 0 && (
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-5 w-5" />
                  <span>{failCount} failed</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results List */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    result.success ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.category} {result.subcategory && `/ ${result.subcategory}`}
                    </p>
                  </div>
                  {result.error && (
                    <p className="text-xs text-red-500">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Refresh */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          disabled={uploading}
        >
          Refresh Page
        </Button>
      </div>
    </div>
  )
}
