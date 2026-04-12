'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  Plus, 
  Minus,
  Volume2,
  VolumeX,
  Timer,
  Zap,
  Clock,
  Target,
  Settings,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

type TimerType = 'stopwatch' | 'countdown' | 'interval' | 'tabata' | 'amrap' | 'emom'

interface TimerState {
  type: TimerType
  isRunning: boolean
  isPaused: boolean
  currentTime: number // in seconds
  targetTime: number // for countdown/amrap
  workTime: number // for interval/tabata
  restTime: number // for interval/tabata
  rounds: number
  currentRound: number
  isWorkPhase: boolean
  prepTime: number
  isPrepping: boolean
}

const defaultState: TimerState = {
  type: 'stopwatch',
  isRunning: false,
  isPaused: false,
  currentTime: 0,
  targetTime: 300, // 5 minutes
  workTime: 20,
  restTime: 10,
  rounds: 8,
  currentRound: 1,
  isWorkPhase: true,
  prepTime: 10,
  isPrepping: false,
}

export default function TimerPage() {
  const router = useRouter()
  const { data: presetsData } = useSWR('/api/timer/presets', fetcher)
  
  const [state, setState] = useState<TimerState>(defaultState)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [customName, setCustomName] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
    }
  }, [])

  // Play beep sound
  const playBeep = useCallback((type: 'tick' | 'phase' | 'complete') => {
    if (!soundEnabled || !audioRef.current) return
    
    // Create beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    switch (type) {
      case 'tick':
        oscillator.frequency.value = 800
        gainNode.gain.value = 0.1
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.05)
        break
      case 'phase':
        oscillator.frequency.value = 1000
        gainNode.gain.value = 0.3
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.2)
        break
      case 'complete':
        oscillator.frequency.value = 1200
        gainNode.gain.value = 0.5
        oscillator.start()
        setTimeout(() => {
          oscillator.frequency.value = 1400
        }, 100)
        oscillator.stop(audioContext.currentTime + 0.4)
        break
    }
  }, [soundEnabled])

  // Timer logic
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          // Prep countdown
          if (prev.isPrepping) {
            if (prev.prepTime <= 1) {
              playBeep('phase')
              return { ...prev, isPrepping: false, prepTime: 10 }
            }
            if (prev.prepTime <= 3) playBeep('tick')
            return { ...prev, prepTime: prev.prepTime - 1 }
          }

          switch (prev.type) {
            case 'stopwatch':
              return { ...prev, currentTime: prev.currentTime + 1 }
            
            case 'countdown':
              if (prev.currentTime <= 1) {
                playBeep('complete')
                return { ...prev, isRunning: false, currentTime: 0 }
              }
              if (prev.currentTime <= 3) playBeep('tick')
              return { ...prev, currentTime: prev.currentTime - 1 }
            
            case 'interval':
            case 'tabata':
              const currentPhaseTime = prev.isWorkPhase ? prev.workTime : prev.restTime
              if (prev.currentTime >= currentPhaseTime) {
                // Switch phase
                if (!prev.isWorkPhase) {
                  // End of rest, check if done
                  if (prev.currentRound >= prev.rounds) {
                    playBeep('complete')
                    return { ...prev, isRunning: false, currentTime: 0, currentRound: 1, isWorkPhase: true }
                  }
                  playBeep('phase')
                  return { ...prev, currentTime: 0, currentRound: prev.currentRound + 1, isWorkPhase: true }
                }
                playBeep('phase')
                return { ...prev, currentTime: 0, isWorkPhase: false }
              }
              return { ...prev, currentTime: prev.currentTime + 1 }
            
            case 'amrap':
              if (prev.currentTime >= prev.targetTime) {
                playBeep('complete')
                return { ...prev, isRunning: false }
              }
              return { ...prev, currentTime: prev.currentTime + 1 }
            
            case 'emom':
              if (prev.currentTime >= 60) {
                // End of minute
                if (prev.currentRound >= prev.rounds) {
                  playBeep('complete')
                  return { ...prev, isRunning: false, currentTime: 0, currentRound: 1 }
                }
                playBeep('phase')
                return { ...prev, currentTime: 0, currentRound: prev.currentRound + 1 }
              }
              return { ...prev, currentTime: prev.currentTime + 1 }
            
            default:
              return prev
          }
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state.isRunning, state.isPaused, playBeep])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      isPrepping: prev.type !== 'stopwatch',
      currentTime: prev.type === 'countdown' ? prev.targetTime : 0,
    }))
  }

  const pauseTimer = () => {
    setState(prev => ({ ...prev, isPaused: true }))
  }

  const resumeTimer = () => {
    setState(prev => ({ ...prev, isPaused: false }))
  }

  const resetTimer = () => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      currentRound: 1,
      isWorkPhase: true,
      isPrepping: false,
      prepTime: 10,
    }))
  }

  const setTimerType = (type: TimerType) => {
    resetTimer()
    setState(prev => ({ ...prev, type }))
  }

  const applyPreset = (preset: any) => {
    setState(prev => ({
      ...prev,
      type: preset.type,
      workTime: preset.work_seconds,
      restTime: preset.rest_seconds,
      rounds: preset.rounds,
      targetTime: preset.work_seconds * preset.rounds,
    }))
  }

  const savePreset = async () => {
    if (!customName) return
    
    try {
      await fetch('/api/timer/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customName,
          type: state.type,
          workSeconds: state.workTime,
          restSeconds: state.restTime,
          rounds: state.rounds,
          prepSeconds: state.prepTime,
        }),
      })
      setCustomName('')
      setShowSettings(false)
    } catch (error) {
      console.error('Failed to save preset:', error)
    }
  }

  const getPhaseColor = () => {
    if (state.isPrepping) return 'text-yellow-500'
    if (!state.isRunning) return 'text-foreground'
    if (state.type === 'interval' || state.type === 'tabata') {
      return state.isWorkPhase ? 'text-green-500' : 'text-red-500'
    }
    return 'text-primary'
  }

  const getPhaseLabel = () => {
    if (state.isPrepping) return 'GET READY'
    if (!state.isRunning) return 'READY'
    if (state.type === 'interval' || state.type === 'tabata') {
      return state.isWorkPhase ? 'WORK' : 'REST'
    }
    return ''
  }

  const getDisplayTime = () => {
    if (state.isPrepping) return formatTime(state.prepTime)
    
    switch (state.type) {
      case 'stopwatch':
      case 'amrap':
        return formatTime(state.currentTime)
      case 'countdown':
        return formatTime(state.currentTime)
      case 'interval':
      case 'tabata':
        const phaseTime = state.isWorkPhase ? state.workTime : state.restTime
        return formatTime(phaseTime - state.currentTime)
      case 'emom':
        return formatTime(60 - state.currentTime)
      default:
        return formatTime(state.currentTime)
    }
  }

  const getProgress = () => {
    if (state.type === 'interval' || state.type === 'tabata') {
      const phaseTime = state.isWorkPhase ? state.workTime : state.restTime
      return (state.currentTime / phaseTime) * 100
    }
    if (state.type === 'countdown') {
      return ((state.targetTime - state.currentTime) / state.targetTime) * 100
    }
    if (state.type === 'amrap') {
      return (state.currentTime / state.targetTime) * 100
    }
    if (state.type === 'emom') {
      return (state.currentTime / 60) * 100
    }
    return 0
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Workout Timer</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        {/* Timer Type Tabs */}
        <Tabs value={state.type} onValueChange={(v) => setTimerType(v as TimerType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stopwatch" disabled={state.isRunning}>
              <Clock className="mr-1 h-4 w-4" />
              Stop
            </TabsTrigger>
            <TabsTrigger value="countdown" disabled={state.isRunning}>
              <Timer className="mr-1 h-4 w-4" />
              Count
            </TabsTrigger>
            <TabsTrigger value="interval" disabled={state.isRunning}>
              <Zap className="mr-1 h-4 w-4" />
              HIIT
            </TabsTrigger>
          </TabsList>
          <TabsList className="mt-2 grid w-full grid-cols-3">
            <TabsTrigger value="tabata" disabled={state.isRunning}>
              Tabata
            </TabsTrigger>
            <TabsTrigger value="amrap" disabled={state.isRunning}>
              AMRAP
            </TabsTrigger>
            <TabsTrigger value="emom" disabled={state.isRunning}>
              EMOM
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Timer Display */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Progress Bar */}
            {state.type !== 'stopwatch' && (
              <div className="h-2 bg-secondary">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    state.isWorkPhase || state.type === 'countdown' || state.type === 'amrap' 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            )}

            <div className="flex flex-col items-center justify-center py-12">
              {/* Phase Label */}
              {getPhaseLabel() && (
                <p className={`mb-2 text-lg font-semibold uppercase tracking-wider ${getPhaseColor()}`}>
                  {getPhaseLabel()}
                </p>
              )}

              {/* Main Time Display */}
              <div className={`text-7xl font-mono font-bold tabular-nums ${getPhaseColor()}`}>
                {getDisplayTime()}
              </div>

              {/* Round Display */}
              {(state.type === 'interval' || state.type === 'tabata' || state.type === 'emom') && (
                <p className="mt-4 text-lg text-muted-foreground">
                  Round {state.currentRound} of {state.rounds}
                </p>
              )}

              {/* AMRAP Progress */}
              {state.type === 'amrap' && state.isRunning && (
                <p className="mt-4 text-lg text-muted-foreground">
                  {formatTime(state.targetTime - state.currentTime)} remaining
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={resetTimer}
          >
            <RotateCcw className="h-6 w-6" />
          </Button>

          {!state.isRunning ? (
            <Button
              size="icon"
              className="h-20 w-20 rounded-full"
              onClick={startTimer}
            >
              <Play className="h-8 w-8" />
            </Button>
          ) : state.isPaused ? (
            <Button
              size="icon"
              className="h-20 w-20 rounded-full"
              onClick={resumeTimer}
            >
              <Play className="h-8 w-8" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-20 w-20 rounded-full bg-yellow-500 hover:bg-yellow-600"
              onClick={pauseTimer}
            >
              <Pause className="h-8 w-8" />
            </Button>
          )}

          <div className="h-14 w-14" /> {/* Spacer for symmetry */}
        </div>

        {/* Settings Panel */}
        {showSettings && !state.isRunning && (
          <Card>
            <CardHeader>
              <CardTitle>Timer Settings</CardTitle>
              <CardDescription>Customize your timer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Countdown Time */}
              {state.type === 'countdown' && (
                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setState(prev => ({ ...prev, targetTime: Math.max(10, prev.targetTime - 30) }))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={state.targetTime}
                      onChange={(e) => setState(prev => ({ ...prev, targetTime: parseInt(e.target.value) || 0 }))}
                      className="text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setState(prev => ({ ...prev, targetTime: prev.targetTime + 30 }))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatTime(state.targetTime)}</p>
                </div>
              )}

              {/* Interval/Tabata Settings */}
              {(state.type === 'interval' || state.type === 'tabata') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Work (sec)</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setState(prev => ({ ...prev, workTime: Math.max(5, prev.workTime - 5) }))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={state.workTime}
                          onChange={(e) => setState(prev => ({ ...prev, workTime: parseInt(e.target.value) || 20 }))}
                          className="h-8 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setState(prev => ({ ...prev, workTime: prev.workTime + 5 }))}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Rest (sec)</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setState(prev => ({ ...prev, restTime: Math.max(5, prev.restTime - 5) }))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={state.restTime}
                          onChange={(e) => setState(prev => ({ ...prev, restTime: parseInt(e.target.value) || 10 }))}
                          className="h-8 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setState(prev => ({ ...prev, restTime: prev.restTime + 5 }))}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Rounds</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setState(prev => ({ ...prev, rounds: Math.max(1, prev.rounds - 1) }))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center text-xl font-bold">{state.rounds}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setState(prev => ({ ...prev, rounds: prev.rounds + 1 }))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* AMRAP Duration */}
              {state.type === 'amrap' && (
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setState(prev => ({ ...prev, targetTime: Math.max(60, prev.targetTime - 60) }))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-xl font-bold">{Math.floor(state.targetTime / 60)}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setState(prev => ({ ...prev, targetTime: prev.targetTime + 60 }))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* EMOM Rounds */}
              {state.type === 'emom' && (
                <div className="space-y-2">
                  <Label>Minutes (rounds)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setState(prev => ({ ...prev, rounds: Math.max(1, prev.rounds - 1) }))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-xl font-bold">{state.rounds}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setState(prev => ({ ...prev, rounds: prev.rounds + 1 }))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Save as Preset */}
              <div className="border-t border-border pt-4">
                <Label>Save as Preset</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Preset name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                  <Button onClick={savePreset} disabled={!customName}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Presets */}
        {!state.isRunning && presetsData?.presets && presetsData.presets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Presets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {presetsData.presets.map((preset: any) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    className="h-auto flex-col items-start p-3"
                    onClick={() => applyPreset(preset)}
                  >
                    <span className="font-semibold">{preset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {preset.type === 'tabata' || preset.type === 'interval' 
                        ? `${preset.work_seconds}s/${preset.rest_seconds}s x${preset.rounds}`
                        : `${Math.floor(preset.work_seconds / 60)} min`
                      }
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timer Type Info */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              {state.type === 'stopwatch' && (
                <p><strong>Stopwatch:</strong> Counts up from zero. Perfect for tracking exercise duration.</p>
              )}
              {state.type === 'countdown' && (
                <p><strong>Countdown:</strong> Counts down from set time. Great for timed holds or rest periods.</p>
              )}
              {state.type === 'interval' && (
                <p><strong>Interval:</strong> Alternates between work and rest periods. Customize times and rounds.</p>
              )}
              {state.type === 'tabata' && (
                <p><strong>Tabata:</strong> Classic 20s work / 10s rest protocol. Adjust to your preference.</p>
              )}
              {state.type === 'amrap' && (
                <p><strong>AMRAP:</strong> As Many Rounds As Possible. Timer counts up for set duration.</p>
              )}
              {state.type === 'emom' && (
                <p><strong>EMOM:</strong> Every Minute On the Minute. Complete exercises at start of each minute.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
