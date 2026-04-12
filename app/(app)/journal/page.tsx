'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, 
  Plus, 
  Calendar,
  Smile,
  Frown,
  Meh,
  Zap,
  Moon,
  Hash,
  Save,
  BookOpen,
  Edit2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const MOOD_OPTIONS = [
  { value: 1, label: 'Bad', icon: Frown, color: 'text-red-500' },
  { value: 2, label: 'Low', icon: Frown, color: 'text-orange-500' },
  { value: 3, label: 'Okay', icon: Meh, color: 'text-yellow-500' },
  { value: 4, label: 'Good', icon: Smile, color: 'text-lime-500' },
  { value: 5, label: 'Great', icon: Smile, color: 'text-green-500' },
]

const COMMON_TAGS = [
  'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio',
  'heavy', 'light', 'pr', 'tired', 'motivated', 'sore', 'recovery'
]

export default function JournalPage() {
  const router = useRouter()
  const { data, isLoading } = useSWR('/api/journal', fetcher)
  
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [content, setContent] = useState('')
  const [moodRating, setMoodRating] = useState<number | null>(null)
  const [energyLevel, setEnergyLevel] = useState<number | null>(null)
  const [sleepQuality, setSleepQuality] = useState<number | null>(null)
  const [sleepHours, setSleepHours] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')

  const resetForm = () => {
    setContent('')
    setMoodRating(null)
    setEnergyLevel(null)
    setSleepQuality(null)
    setSleepHours('')
    setSelectedTags([])
    setCustomTag('')
    setEditingId(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          moodRating,
          energyLevel,
          sleepQuality,
          sleepHours: sleepHours ? parseFloat(sleepHours) : null,
          tags: selectedTags,
        }),
      })

      mutate('/api/journal')
      setShowForm(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save journal entry:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    if (customTag && !selectedTags.includes(customTag.toLowerCase())) {
      setSelectedTags(prev => [...prev, customTag.toLowerCase()])
      setCustomTag('')
    }
  }

  const editEntry = (entry: any) => {
    setContent(entry.content || '')
    setMoodRating(entry.mood_rating)
    setEnergyLevel(entry.energy_level)
    setSleepQuality(entry.sleep_quality)
    setSleepHours(entry.sleep_hours?.toString() || '')
    setSelectedTags(entry.tags || [])
    setEditingId(entry.id)
    setShowForm(true)
  }

  const getMoodIcon = (rating: number | null) => {
    if (!rating) return null
    const mood = MOOD_OPTIONS.find(m => m.value === rating)
    return mood ? <mood.icon className={`h-4 w-4 ${mood.color}`} /> : null
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Fitness Journal</h1>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            <Plus className="mr-1 h-4 w-4" />
            Entry
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        {/* Stats Overview */}
        {data?.stats && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <BookOpen className="mx-auto mb-1 h-5 w-5 text-primary" />
                <p className="text-xl font-bold">{data.stats.total_entries || 0}</p>
                <p className="text-xs text-muted-foreground">Entries</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Smile className="mx-auto mb-1 h-5 w-5 text-green-500" />
                <p className="text-xl font-bold">{data.stats.avg_mood ? Number(data.stats.avg_mood).toFixed(1) : '--'}</p>
                <p className="text-xs text-muted-foreground">Avg Mood</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Zap className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
                <p className="text-xl font-bold">{data.stats.avg_energy ? Number(data.stats.avg_energy).toFixed(1) : '--'}</p>
                <p className="text-xs text-muted-foreground">Avg Energy</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* New Entry Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Entry' : 'New Journal Entry'}</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mood Rating */}
              <div className="space-y-2">
                <Label>How are you feeling?</Label>
                <div className="flex justify-between gap-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setMoodRating(mood.value)}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                        moodRating === mood.value 
                          ? 'bg-primary/20 ring-2 ring-primary' 
                          : 'bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      <mood.icon className={`h-6 w-6 ${mood.color}`} />
                      <span className="text-xs">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Energy Level (1-10)
                </Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <button
                      key={level}
                      onClick={() => setEnergyLevel(level)}
                      className={`flex-1 rounded py-2 text-sm transition-colors ${
                        energyLevel === level
                          ? 'bg-yellow-500 text-white'
                          : energyLevel && level <= energyLevel
                            ? 'bg-yellow-500/50'
                            : 'bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sleep */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Sleep Quality (1-5)
                  </Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setSleepQuality(level)}
                        className={`flex-1 rounded py-2 text-sm transition-colors ${
                          sleepQuality === level
                            ? 'bg-blue-500 text-white'
                            : sleepQuality && level <= sleepQuality
                              ? 'bg-blue-500/50'
                              : 'bg-secondary/50 hover:bg-secondary'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hours Slept</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="7.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom tag..."
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                  />
                  <Button variant="outline" onClick={addCustomTag}>Add</Button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="How was your workout? Any insights, challenges, or wins to record..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                Save Entry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Journal Entries */}
        <div className="space-y-3">
          {data?.entries?.length === 0 && !showForm && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">No Journal Entries Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start documenting your fitness journey
                </p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Entry
                </Button>
              </CardContent>
            </Card>
          )}

          {data?.entries?.map((entry: any) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {new Date(entry.entry_date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getMoodIcon(entry.mood_rating)}
                    {entry.energy_level && (
                      <span className="flex items-center gap-1 text-xs text-yellow-500">
                        <Zap className="h-3 w-3" />
                        {entry.energy_level}
                      </span>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => editEntry(entry)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {entry.content && (
                  <p className="mb-3 text-sm text-foreground">{entry.content}</p>
                )}
                
                {entry.sleep_hours && (
                  <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Moon className="h-3 w-3" />
                    {entry.sleep_hours}h sleep
                    {entry.sleep_quality && ` (${entry.sleep_quality}/5 quality)`}
                  </p>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
