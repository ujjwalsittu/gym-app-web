'use client'

import { useState } from 'react'
import { Send, Link2, Unlink, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function TelegramSettings() {
  const { data, isLoading, mutate } = useSWR('/api/telegram/link', fetcher)
  const [linkCode, setLinkCode] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [error, setError] = useState('')

  const handleLink = async () => {
    if (!linkCode.trim()) return
    
    setIsLinking(true)
    setError('')

    try {
      const response = await fetch('/api/telegram/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: linkCode })
      })

      if (response.ok) {
        setLinkCode('')
        mutate()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to link account')
      }
    } catch (err) {
      setError('Failed to link account')
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlink = async () => {
    setIsUnlinking(true)
    try {
      await fetch('/api/telegram/link', { method: 'DELETE' })
      mutate()
    } catch (err) {
      console.error('Unlink error:', err)
    } finally {
      setIsUnlinking(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardContent className="p-6 flex justify-center">
          <Spinner className="h-6 w-6" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0088cc]/20 flex items-center justify-center">
              <Send className="h-5 w-5 text-[#0088cc]" />
            </div>
            <div>
              <CardTitle className="text-base">Telegram</CardTitle>
              <CardDescription>
                Get reminders and log progress via Telegram
              </CardDescription>
            </div>
          </div>
          {data?.isLinked && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-500">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.isLinked ? (
          <>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Connected as: <span className="font-medium">@{data.username || 'Unknown'}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You&apos;ll receive workout reminders and can log water/progress via Telegram.
              </p>
            </div>
            <Button 
              variant="outline" 
              className="w-full text-destructive"
              onClick={handleUnlink}
              disabled={isUnlinking}
            >
              {isUnlinking ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Unlink className="h-4 w-4 mr-2" />
              )}
              Disconnect Telegram
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">How to connect:</p>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Open Telegram and search for <span className="font-mono">@VisionaryFitBot</span></li>
                  <li>2. Send <span className="font-mono">/start</span> to the bot</li>
                  <li>3. Enter the code you receive below</li>
                </ol>
              </div>

              <a 
                href="https://t.me/VisionaryFitBot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Telegram Bot
                </Button>
              </a>

              <div className="space-y-2">
                <Label>Link Code</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={linkCode}
                    onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="font-mono tracking-wider"
                  />
                  <Button onClick={handleLink} disabled={isLinking || linkCode.length < 6}>
                    {isLinking ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
