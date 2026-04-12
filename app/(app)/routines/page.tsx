'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft, 
  Play, 
  Clock, 
  Heart,
  Flame,
  Wind,
  Sparkles,
  Target,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const TYPE_INFO = {
  warmup: {
    label: 'Warm-up',
    description: 'Prepare your body for exercise',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  cooldown: {
    label: 'Cool-down',
    description: 'Help your body recover',
    icon: Wind,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  stretch: {
    label: 'Stretching',
    description: 'Improve flexibility',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  yoga: {
    label: 'Yoga',
    description: 'Mind-body connection',
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
}

export default function RoutinesPage() {
  const router = useRouter()
  const { data, isLoading } = useSWR('/api/routines', fetcher)
  const [activeTab, setActiveTab] = useState('warmup')

  const handleSaveToggle = async (routineId: string, isSaved: boolean) => {
    try {
      await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isSaved ? 'unsave' : 'save',
          routineId,
        }),
      })
      mutate('/api/routines')
    } catch (error) {
      console.error('Failed to toggle save:', error)
    }
  }

  const filteredRoutines = data?.routines?.filter(
    (r: any) => r.type === activeTab
  ) || []

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const typeInfo = TYPE_INFO[activeTab as keyof typeof TYPE_INFO]
  const TypeIcon = typeInfo?.icon || Target

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Routines</h1>
          <Button size="sm" variant="outline">
            <Plus className="mr-1 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        {/* Type Overview */}
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(TYPE_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex flex-col items-center gap-1 rounded-lg p-3 transition-colors ${
                activeTab === key 
                  ? `${info.bgColor} ring-2 ring-primary` 
                  : 'bg-secondary/50 hover:bg-secondary'
              }`}
            >
              <info.icon className={`h-5 w-5 ${info.color}`} />
              <span className="text-xs font-medium">{info.label}</span>
            </button>
          ))}
        </div>

        {/* Description */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-full p-3 ${typeInfo?.bgColor}`}>
              <TypeIcon className={`h-6 w-6 ${typeInfo?.color}`} />
            </div>
            <div>
              <h2 className="font-semibold">{typeInfo?.label} Routines</h2>
              <p className="text-sm text-muted-foreground">{typeInfo?.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Routines List */}
        <div className="space-y-3">
          {filteredRoutines.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TypeIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">No {typeInfo?.label} Routines</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later or create your own
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRoutines.map((routine: any) => (
              <Card key={routine.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <div className={`rounded-lg p-3 ${typeInfo?.bgColor}`}>
                      <TypeIcon className={`h-6 w-6 ${typeInfo?.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{routine.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {routine.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {routine.duration_minutes} min
                        </span>
                        <span>
                          {routine.exercises?.length || 0} exercises
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSaveToggle(routine.id, routine.isSaved)}
                      >
                        <Heart 
                          className={`h-5 w-5 ${
                            routine.isSaved ? 'fill-red-500 text-red-500' : ''
                          }`} 
                        />
                      </Button>
                    </div>
                  </div>

                  {/* Target Areas */}
                  {routine.target_areas && routine.target_areas.length > 0 && (
                    <div className="border-t border-border px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {routine.target_areas.map((area: string) => (
                          <Badge key={area} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Start Button */}
                  <div className="border-t border-border p-3">
                    <Link href={`/routines/${routine.id}`}>
                      <Button className="w-full">
                        <Play className="mr-2 h-4 w-4" />
                        Start Routine
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {activeTab === 'warmup' && 'Warm-up Tips'}
              {activeTab === 'cooldown' && 'Cool-down Tips'}
              {activeTab === 'stretch' && 'Stretching Tips'}
              {activeTab === 'yoga' && 'Yoga Tips'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {activeTab === 'warmup' && (
              <>
                <p>Always warm up for 5-10 minutes before intense exercise</p>
                <p>Start with light cardio to increase heart rate</p>
                <p>Include dynamic stretches that mimic your workout movements</p>
              </>
            )}
            {activeTab === 'cooldown' && (
              <>
                <p>Never skip cooling down after a workout</p>
                <p>Walk slowly for 3-5 minutes to lower heart rate gradually</p>
                <p>Static stretches are best for cool-downs</p>
              </>
            )}
            {activeTab === 'stretch' && (
              <>
                <p>Hold each stretch for 15-30 seconds</p>
                <p>Never bounce while stretching</p>
                <p>Breathe deeply and relax into each stretch</p>
              </>
            )}
            {activeTab === 'yoga' && (
              <>
                <p>Focus on your breath throughout the practice</p>
                <p>Listen to your body and modify poses as needed</p>
                <p>Consistency is more important than intensity</p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
