'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import { Spinner } from '@/components/ui/spinner'
import { 
  Utensils, Droplets, Moon, Flame, 
  Plus, Minus, Save, Loader2, Apple, 
  Beef, Wheat, Droplet
} from 'lucide-react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function DietPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [saving, setSaving] = useState(false)

  const { data, isLoading, mutate } = useSWR(
    user ? '/api/diet' : null,
    fetcher
  )

  const [formData, setFormData] = useState({
    water_glasses: 0,
    calories_consumed: 0,
    protein_grams: 0,
    carbs_grams: 0,
    fat_grams: 0,
    weight_kg: '',
    sleep_hours: '',
    mood: 3,
    energy_level: 3
  })

  useEffect(() => {
    if (data?.todayLog) {
      setFormData({
        water_glasses: data.todayLog.water_glasses || 0,
        calories_consumed: data.todayLog.calories_consumed || 0,
        protein_grams: data.todayLog.protein_grams || 0,
        carbs_grams: data.todayLog.carbs_grams || 0,
        fat_grams: data.todayLog.fat_grams || 0,
        weight_kg: data.todayLog.weight_kg?.toString() || '',
        sleep_hours: data.todayLog.sleep_hours?.toString() || '',
        mood: data.todayLog.mood || 3,
        energy_level: data.todayLog.energy_level || 3
      })
    }
  }, [data])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : null
        })
      })
      await mutate()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const incrementValue = (field: string, amount: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, (prev[field as keyof typeof prev] as number) + amount)
    }))
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const dietPlan = data?.dietPlan?.plan
  const targetCalories = dietPlan?.dailyCalories || 2000
  const targetProtein = dietPlan?.macros?.protein || 150
  const targetCarbs = dietPlan?.macros?.carbs || 200
  const targetFat = dietPlan?.macros?.fat || 70

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur p-4">
        <h1 className="text-xl font-bold">Diet & Nutrition</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </header>

      <main className="mx-auto max-w-lg space-y-6 p-4">
        {/* Calorie Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-5 w-5 text-primary" />
                Calories
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {formData.calories_consumed} / {targetCalories}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress 
              value={Math.min(100, (formData.calories_consumed / targetCalories) * 100)} 
              className="h-3"
            />
            <div className="mt-4 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => incrementValue('calories_consumed', -100)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={formData.calories_consumed}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  calories_consumed: parseInt(e.target.value) || 0 
                }))}
                className="w-24 text-center text-lg"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => incrementValue('calories_consumed', 100)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Macros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Macros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Protein */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Beef className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Protein</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formData.protein_grams}g / {targetProtein}g
                </span>
              </div>
              <Progress 
                value={Math.min(100, (formData.protein_grams / targetProtein) * 100)}
                className="h-2"
              />
              <div className="flex items-center justify-center gap-3">
                <Button size="sm" variant="outline" onClick={() => incrementValue('protein_grams', -10)}>-10</Button>
                <Input
                  type="number"
                  value={formData.protein_grams}
                  onChange={(e) => setFormData(prev => ({ ...prev, protein_grams: parseInt(e.target.value) || 0 }))}
                  className="w-20 text-center"
                />
                <Button size="sm" variant="outline" onClick={() => incrementValue('protein_grams', 10)}>+10</Button>
              </div>
            </div>

            {/* Carbs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Carbs</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formData.carbs_grams}g / {targetCarbs}g
                </span>
              </div>
              <Progress 
                value={Math.min(100, (formData.carbs_grams / targetCarbs) * 100)}
                className="h-2"
              />
              <div className="flex items-center justify-center gap-3">
                <Button size="sm" variant="outline" onClick={() => incrementValue('carbs_grams', -10)}>-10</Button>
                <Input
                  type="number"
                  value={formData.carbs_grams}
                  onChange={(e) => setFormData(prev => ({ ...prev, carbs_grams: parseInt(e.target.value) || 0 }))}
                  className="w-20 text-center"
                />
                <Button size="sm" variant="outline" onClick={() => incrementValue('carbs_grams', 10)}>+10</Button>
              </div>
            </div>

            {/* Fat */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Fat</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formData.fat_grams}g / {targetFat}g
                </span>
              </div>
              <Progress 
                value={Math.min(100, (formData.fat_grams / targetFat) * 100)}
                className="h-2"
              />
              <div className="flex items-center justify-center gap-3">
                <Button size="sm" variant="outline" onClick={() => incrementValue('fat_grams', -5)}>-5</Button>
                <Input
                  type="number"
                  value={formData.fat_grams}
                  onChange={(e) => setFormData(prev => ({ ...prev, fat_grams: parseInt(e.target.value) || 0 }))}
                  className="w-20 text-center"
                />
                <Button size="sm" variant="outline" onClick={() => incrementValue('fat_grams', 5)}>+5</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Water */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Droplets className="h-5 w-5 text-blue-500" />
                Water
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {formData.water_glasses} glasses
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.from({ length: 10 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFormData(prev => ({ ...prev, water_glasses: i + 1 }))}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    i < formData.water_glasses
                      ? 'bg-blue-500 text-white'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <Droplets className="h-5 w-5" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Check-in */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Weight */}
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm">Weight (kg)</label>
              <Input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                className="w-24 text-center"
                placeholder="--"
              />
            </div>

            {/* Sleep */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-500" />
                <label className="text-sm">Sleep (hours)</label>
              </div>
              <Input
                type="number"
                step="0.5"
                value={formData.sleep_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, sleep_hours: e.target.value }))}
                className="w-24 text-center"
                placeholder="--"
              />
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <label className="text-sm">Mood</label>
              <div className="flex justify-center gap-2">
                {['😫', '😕', '😐', '🙂', '😄'].map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => setFormData(prev => ({ ...prev, mood: i + 1 }))}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition-all ${
                      formData.mood === i + 1
                        ? 'scale-125 bg-primary/20'
                        : 'bg-secondary'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div className="space-y-2">
              <label className="text-sm">Energy Level</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormData(prev => ({ ...prev, energy_level: level }))}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      formData.energy_level >= level
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meal Plan */}
        {dietPlan?.meals && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Utensils className="h-5 w-5" />
                {"Today's Meals"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dietPlan.meals.map((meal: { name: string; time: string; foods: string[]; calories: number }, index: number) => (
                <div key={index} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{meal.name}</h4>
                    <span className="text-sm text-muted-foreground">{meal.time}</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {meal.foods.map((food: string, i: number) => (
                      <li key={i}>- {food}</li>
                    ))}
                  </ul>
                  <div className="mt-2 text-xs text-primary">{meal.calories} kcal</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Today&apos;s Log
        </Button>
      </main>

      <BottomNav />
    </div>
  )
}
