'use client'

import { useState } from 'react'
import { ArrowLeft, ChefHat, Clock, Users, Flame, Plus, Sparkles, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'pre_workout', label: 'Pre-Workout' },
  { value: 'post_workout', label: 'Post-Workout' }
]

export default function RecipesPage() {
  const { data, isLoading, mutate } = useSWR('/api/recipes', fetcher)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [mealType, setMealType] = useState('lunch')
  const [preferences, setPreferences] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)

  const recipes = data?.recipes || []

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealType, preferences })
      })
      
      if (response.ok) {
        const { recipe } = await response.json()
        setSelectedRecipe(recipe)
        setShowGenerator(false)
        mutate()
      } else {
        alert('Failed to generate recipe')
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate recipe')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Recipes</h1>
          </div>
          <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate AI Recipe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Meal Type</Label>
                  <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mealTypes.map(m => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferences (optional)</Label>
                  <Input
                    placeholder="e.g., high protein, quick to make, Asian cuisine"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Recipe
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Recipe List */}
        {recipes.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="p-8 text-center">
              <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold mb-2">No Recipes Yet</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Generate AI-powered recipes tailored to your diet plan!
              </p>
              <Button onClick={() => setShowGenerator(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Your First Recipe
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe: any) => (
              <Card 
                key={recipe.id} 
                className="bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{recipe.name}</h3>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {recipe.meal_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {recipe.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {recipe.prep_time + recipe.cook_time} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-4 w-4" />
                          {recipe.calories} cal
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {recipe.servings}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recipe Detail Modal */}
        <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {selectedRecipe && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedRecipe.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{selectedRecipe.description}</p>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-muted rounded-lg">
                      <p className="text-lg font-bold">{selectedRecipe.prep_time || selectedRecipe.prepTime}</p>
                      <p className="text-xs text-muted-foreground">Prep</p>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <p className="text-lg font-bold">{selectedRecipe.cook_time || selectedRecipe.cookTime}</p>
                      <p className="text-xs text-muted-foreground">Cook</p>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <p className="text-lg font-bold">{selectedRecipe.calories}</p>
                      <p className="text-xs text-muted-foreground">Cal</p>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <p className="text-lg font-bold">{selectedRecipe.servings}</p>
                      <p className="text-xs text-muted-foreground">Serve</p>
                    </div>
                  </div>

                  {/* Macros */}
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex justify-around text-center">
                        <div>
                          <p className="font-bold text-primary">{selectedRecipe.protein}g</p>
                          <p className="text-xs">Protein</p>
                        </div>
                        <div>
                          <p className="font-bold">{selectedRecipe.carbs}g</p>
                          <p className="text-xs">Carbs</p>
                        </div>
                        <div>
                          <p className="font-bold">{selectedRecipe.fat}g</p>
                          <p className="text-xs">Fat</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ingredients */}
                  <div>
                    <h4 className="font-semibold mb-2">Ingredients</h4>
                    <ul className="space-y-1">
                      {selectedRecipe.ingredients?.map((ing: any, i: number) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {ing.amount} {ing.unit} {ing.item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h4 className="font-semibold mb-2">Instructions</h4>
                    <ol className="space-y-2">
                      {selectedRecipe.instructions?.map((step: string, i: number) => (
                        <li key={i} className="text-sm flex gap-3">
                          <span className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Tips */}
                  {selectedRecipe.tips && selectedRecipe.tips.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Tips</h4>
                      <ul className="space-y-1">
                        {selectedRecipe.tips.map((tip: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
