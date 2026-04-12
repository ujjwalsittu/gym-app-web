'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import { ExerciseAnimation } from '@/components/workout/exercise-animation'
import { 
  Search, 
  Filter,
  X,
  Dumbbell,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Play,
  Info
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const CATEGORY_ICONS: Record<string, string> = {
  'upper-body': 'Upper Body',
  'lower-body': 'Lower Body',
  'core': 'Core',
  'cardio': 'Cardio',
  'stretching': 'Stretching'
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-500',
  intermediate: 'bg-yellow-500/20 text-yellow-500',
  advanced: 'bg-red-500/20 text-red-500'
}

interface Exercise {
  id: string
  name: string
  category: string
  description: string
  instructions: string[]
  tips: string[]
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string[]
  difficulty: string
  caloriesPerMinute: number
  animationFrames: number
}

export default function ExercisesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [playingAnimation, setPlayingAnimation] = useState<string | null>(null)

  // Build query string
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedMuscle) params.set('muscle', selectedMuscle)
    if (selectedDifficulty) params.set('difficulty', selectedDifficulty)
    return params.toString()
  }, [searchQuery, selectedCategory, selectedMuscle, selectedDifficulty])

  const { data, isLoading } = useSWR(
    `/api/exercises${queryParams ? `?${queryParams}` : ''}`,
    fetcher
  )

  const clearFilters = () => {
    setSelectedCategory(null)
    setSelectedMuscle(null)
    setSelectedDifficulty(null)
    setSearchQuery('')
  }

  const hasActiveFilters = selectedCategory || selectedMuscle || selectedDifficulty || searchQuery

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Exercise Library</h1>
            <span className="text-sm text-muted-foreground">
              {data?.total || 0} exercises
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {[selectedCategory, selectedMuscle, selectedDifficulty].filter(Boolean).length}
                </span>
              )}
            </span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {/* Filters Panel */}
          {showFilters && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              {/* Categories */}
              <div>
                <p className="text-sm font-medium mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {data?.filters?.categories?.map((cat: string) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    >
                      {CATEGORY_ICONS[cat] || cat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Muscle Groups */}
              <div>
                <p className="text-sm font-medium mb-2">Muscle Group</p>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {data?.filters?.muscleGroups?.slice(0, 12).map((muscle: string) => (
                    <Button
                      key={muscle}
                      variant={selectedMuscle === muscle.toLowerCase() ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMuscle(selectedMuscle === muscle.toLowerCase() ? null : muscle.toLowerCase())}
                    >
                      {muscle}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <p className="text-sm font-medium mb-2">Difficulty</p>
                <div className="flex gap-2">
                  {['beginner', 'intermediate', 'advanced'].map((diff) => (
                    <Button
                      key={diff}
                      variant={selectedDifficulty === diff ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                      className="capitalize"
                    >
                      {diff}
                    </Button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : data?.exercises?.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No exercises found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          data?.exercises?.map((exercise: Exercise) => (
            <Card 
              key={exercise.id} 
              className={`overflow-hidden transition-all ${expandedExercise === exercise.id ? 'ring-2 ring-primary' : ''}`}
            >
              <CardContent className="p-0">
                {/* Exercise Header */}
                <button
                  onClick={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Animation Preview */}
                    <div 
                      className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPlayingAnimation(playingAnimation === exercise.id ? null : exercise.id)
                      }}
                    >
                      {playingAnimation === exercise.id ? (
                        <ExerciseAnimation 
                          exerciseName={exercise.name} 
                          autoplay={true} 
                          size="sm"
                          showControls={false}
                        />
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <Dumbbell className="h-6 w-6 text-muted-foreground" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold truncate">{exercise.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${DIFFICULTY_COLORS[exercise.difficulty]}`}>
                          {exercise.difficulty}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.primaryMuscles.slice(0, 2).map((muscle: string) => (
                          <span key={muscle} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {muscle}
                          </span>
                        ))}
                        {exercise.primaryMuscles.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{exercise.primaryMuscles.length - 2}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {exercise.description}
                      </p>
                    </div>

                    {expandedExercise === exercise.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedExercise === exercise.id && (
                  <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 border-t border-border pt-4">
                    {/* Large Animation */}
                    <div className="flex justify-center">
                      <ExerciseAnimation 
                        exerciseName={exercise.name} 
                        autoplay={true} 
                        size="lg"
                        showControls={true}
                      />
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted rounded-lg p-2">
                        <Target className="h-4 w-4 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p className="text-sm font-medium capitalize">{exercise.category.replace('-', ' ')}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <Zap className="h-4 w-4 mx-auto mb-1 text-chart-4" />
                        <p className="text-xs text-muted-foreground">Calories</p>
                        <p className="text-sm font-medium">{exercise.caloriesPerMinute}/min</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <Dumbbell className="h-4 w-4 mx-auto mb-1 text-chart-2" />
                        <p className="text-xs text-muted-foreground">Equipment</p>
                        <p className="text-sm font-medium truncate">{exercise.equipment[0] || 'None'}</p>
                      </div>
                    </div>

                    {/* Muscles */}
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Target Muscles
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {exercise.primaryMuscles.map((muscle: string) => (
                          <span key={muscle} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                            {muscle}
                          </span>
                        ))}
                        {exercise.secondaryMuscles.map((muscle: string) => (
                          <span key={muscle} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        How to Perform
                      </p>
                      <ol className="space-y-2">
                        {exercise.instructions.map((step: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary font-medium">{index + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Tips */}
                    {exercise.tips.length > 0 && (
                      <div className="bg-primary/5 rounded-lg p-3">
                        <p className="text-sm font-medium mb-2">Pro Tips</p>
                        <ul className="space-y-1">
                          {exercise.tips.map((tip: string, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}
