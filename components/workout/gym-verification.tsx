'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Video, Square, Check, X, RotateCcw, 
  Camera, MapPin, AlertCircle, Loader2 
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface GymVerificationProps {
  onVerified: () => void
  onSkip?: () => void
  required?: boolean
}

export function GymVerification({ 
  onVerified, 
  onSkip,
  required = false 
}: GymVerificationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'verified' | 'failed'>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<{
    isGym: boolean
    confidence: number
    details: string
  } | null>(null)

  const MAX_RECORDING_TIME = 10 // seconds
  const MIN_RECORDING_TIME = 3 // seconds

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status === 'recording') {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [status])

  const startCamera = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: false
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.')
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const startRecording = useCallback(() => {
    if (!stream) return

    chunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      processRecording()
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setStatus('recording')
    setRecordingTime(0)
  }, [stream])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop()
      setStatus('processing')
    }
  }, [status])

  const processRecording = async () => {
    try {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      
      // Extract a frame for analysis
      const video = document.createElement('video')
      video.src = URL.createObjectURL(blob)
      
      await new Promise((resolve) => {
        video.onloadeddata = resolve
      })

      // Capture frame at middle of video
      video.currentTime = video.duration / 2
      await new Promise((resolve) => {
        video.onseeked = resolve
      })

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)
      
      // Convert to base64 for AI analysis
      const imageData = canvas.toDataURL('image/jpeg', 0.8)

      // Send to verification API
      const response = await fetch('/api/verify-gym', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      })

      const result = await response.json()

      if (result.success && result.isGym) {
        setVerificationResult({
          isGym: true,
          confidence: result.confidence,
          details: result.details
        })
        setStatus('verified')
        
        // Upload video to blob storage
        const formData = new FormData()
        formData.append('video', blob, `gym-verification-${Date.now()}.webm`)
        await fetch('/api/upload/video', {
          method: 'POST',
          body: formData
        })
        
        setTimeout(() => {
          stopCamera()
          onVerified()
        }, 2000)
      } else {
        setVerificationResult({
          isGym: false,
          confidence: result.confidence || 0,
          details: result.details || 'Could not verify gym environment'
        })
        setStatus('failed')
      }
    } catch (err) {
      console.error('Verification error:', err)
      setStatus('failed')
      setVerificationResult({
        isGym: false,
        confidence: 0,
        details: 'Verification failed. Please try again.'
      })
    }
  }

  const retry = () => {
    setStatus('idle')
    setRecordingTime(0)
    setVerificationResult(null)
    setError(null)
  }

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Gym Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Record a short video showing your gym environment
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="relative aspect-video overflow-hidden rounded-lg bg-secondary">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="mt-2 text-sm text-destructive">{error}</p>
              <Button onClick={startCamera} className="mt-4" size="sm">
                Try Again
              </Button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          )}
          
          {/* Recording Indicator */}
          {status === 'recording' && (
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-destructive px-3 py-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
              <span className="text-sm font-medium text-white">REC</span>
            </div>
          )}

          {/* Status Overlay */}
          {status === 'processing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-sm">Analyzing gym environment...</p>
            </div>
          )}

          {status === 'verified' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
              <div className="rounded-full bg-green-500/20 p-4">
                <Check className="h-12 w-12 text-green-500" />
              </div>
              <p className="mt-4 font-medium text-green-500">Gym Verified!</p>
              <p className="text-sm text-muted-foreground">
                {verificationResult?.details}
              </p>
            </div>
          )}

          {status === 'failed' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
              <div className="rounded-full bg-destructive/20 p-4">
                <X className="h-12 w-12 text-destructive" />
              </div>
              <p className="mt-4 font-medium text-destructive">Verification Failed</p>
              <p className="text-sm text-muted-foreground text-center px-4">
                {verificationResult?.details}
              </p>
            </div>
          )}
        </div>

        {/* Recording Progress */}
        {status === 'recording' && (
          <div className="space-y-2">
            <Progress value={(recordingTime / MAX_RECORDING_TIME) * 100} />
            <p className="text-center text-sm text-muted-foreground">
              {recordingTime}s / {MAX_RECORDING_TIME}s
              {recordingTime < MIN_RECORDING_TIME && ' (min 3s)'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {status === 'idle' && stream && (
            <Button onClick={startRecording} className="w-full" size="lg">
              <Video className="mr-2 h-5 w-5" />
              Start Recording
            </Button>
          )}

          {status === 'recording' && (
            <Button 
              onClick={stopRecording} 
              variant="destructive" 
              className="w-full"
              size="lg"
              disabled={recordingTime < MIN_RECORDING_TIME}
            >
              <Square className="mr-2 h-5 w-5" />
              Stop Recording
            </Button>
          )}

          {status === 'failed' && (
            <Button onClick={retry} className="w-full" size="lg">
              <RotateCcw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
          )}

          {!required && status !== 'verified' && (
            <Button 
              variant="ghost" 
              onClick={() => {
                stopCamera()
                onSkip?.()
              }}
              className="w-full"
            >
              Skip Verification
            </Button>
          )}
        </div>

        {/* Tips */}
        <div className="rounded-lg bg-secondary/50 p-3 text-sm">
          <p className="font-medium mb-1">Tips for verification:</p>
          <ul className="text-muted-foreground space-y-1">
            <li>- Show gym equipment in frame</li>
            <li>- Include multiple machines if possible</li>
            <li>- Ensure good lighting</li>
            <li>- Pan slowly around the area</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
