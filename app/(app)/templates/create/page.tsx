'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, 
  Plus, 
  Trash2,
  GripVertical,
  Save,
  Globe,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  notes?: string
}

const CATEGORIES = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'full_body', label: 'Full Body' },
  { value: 'upper_body', label: 'Upper Body' },
  { value: 'lower_body', label: 'Lower Body' },
  { value: 'core', label: 'Core' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'general', label: 'General' },
]

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const COMMON_TAGS = [
  'gym', 'home', 'no-equipment', 'dumbbells', 'barbell', 'machines',
  'quick', 'intense', 'beginner-friendly', 'muscle-building', 'fat-loss'
]

export default function CreateTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [estimatedMinutes, setEstimatedMinutes] = useState('45')
  const [isPublic, setIsPublic] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: '1', name: '', sets: 3, reps: '10', restSeconds: 60 }
  ])

  const addExercise = () => {
    setExercises(prev => [
      ...prev,
      { 
        id: Date.now().toString(), 
        name: '', 
        sets: 3, 
        reps: '10', 
        restSeconds: 60 
      }
    ])
  }

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(prev => prev.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ))
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

  const handleSave = async () => {
    if (!name || exercises.length === 0 || exercises.some(e => !e.name)) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          difficulty,
          estimatedMinutes: parseInt(estimatedMinutes),
          isPublic,
          tags: selectedTags,
          exercises: exercises.map(e => ({
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            restSeconds: e.restSeconds,
            notes: e.notes,
          })),
        }),
      })

      if (response.ok) {
        router.push('/templates')
      }
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Create Template</h1>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={saving || !name || exercises.some(e => !e.name)}
          >
            {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Template Info</CardTitle>
            <CardDescription>Basic information about your workout</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g., Push Day, Full Body Blast..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your workout..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map(diff => (
                      <SelectItem key={diff.value} value={diff.value}>
                        {diff.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estimated Duration (minutes)</Label>
              <Input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="h-5 w-5 text-green-500" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {isPublic ? 'Public Template' : 'Private Template'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPublic 
                      ? 'Anyone can see and use this template' 
                      : 'Only you can see this template'}
                  </p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Help others find your template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.map(tag => (
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
          </CardContent>
        </Card>

        {/* Exercises */}
        <Card>
          <CardHeader>
            <CardTitle>Exercises</CardTitle>
            <CardDescription>Add exercises to your template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exercises.map((exercise, index) => (
              <div 
                key={exercise.id}
                className="rounded-lg border border-border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Exercise {index + 1}</span>
                  </div>
                  {exercises.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeExercise(exercise.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Exercise Name *</Label>
                  <Input
                    placeholder="e.g., Bench Press, Squats..."
                    value={exercise.name}
                    onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Sets</Label>
                    <Input
                      type="number"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Reps</Label>
                    <Input
                      placeholder="10 or 8-12"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Rest (s)</Label>
                    <Input
                      type="number"
                      value={exercise.restSeconds}
                      onChange={(e) => updateExercise(exercise.id, 'restSeconds', parseInt(e.target.value) || 60)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Notes (optional)</Label>
                  <Input
                    placeholder="Form cues, tempo, etc."
                    value={exercise.notes || ''}
                    onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={addExercise}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Exercise
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-semibold">{name || 'Untitled Template'}</h3>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              <div className="flex gap-2">
                <Badge>{category}</Badge>
                <Badge variant="outline">{difficulty}</Badge>
                <Badge variant="secondary">{estimatedMinutes} min</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {exercises.filter(e => e.name).length} exercises
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
