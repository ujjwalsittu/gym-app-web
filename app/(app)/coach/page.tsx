'use client'

import { useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowLeft, Send, Bot, User, Sparkles, Dumbbell, Apple, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'

const quickPrompts = [
  { icon: Dumbbell, label: 'Form Tips', prompt: 'Can you give me tips on proper squat form?' },
  { icon: Apple, label: 'Meal Ideas', prompt: 'What should I eat before my workout?' },
  { icon: HelpCircle, label: 'Modify Plan', prompt: 'Can you suggest modifications to my current workout plan?' },
  { icon: Sparkles, label: 'Motivation', prompt: 'I need some motivation to push through today!' },
]

export default function CoachPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, input, setInput, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/coach' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage({ text: input })
      setInput('')
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    if (!isLoading) {
      sendMessage({ text: prompt })
    }
  }

  const getMessageText = (msg: typeof messages[0]) => {
    if (!msg.parts) return ''
    return msg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold">AI Coach</h1>
              <p className="text-xs text-muted-foreground">Your personal fitness assistant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.length === 0 ? (
          <div className="space-y-6">
            <Card className="bg-card/50 border-dashed">
              <CardContent className="p-6 text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h2 className="text-lg font-semibold mb-2">Welcome to AI Coach!</h2>
                <p className="text-sm text-muted-foreground">
                  I&apos;m your personal fitness assistant. Ask me about workout form, 
                  nutrition advice, plan modifications, or anything fitness-related!
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">Quick prompts:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickPrompts.map((item) => (
                  <Button
                    key={item.label}
                    variant="outline"
                    className="h-auto py-3 px-4 justify-start"
                    onClick={() => handleQuickPrompt(item.prompt)}
                  >
                    <item.icon className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{getMessageText(message)}</p>
              </div>

              {message.role === 'user' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-secondary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3 justify-start">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <Spinner className="h-4 w-4" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach anything..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
