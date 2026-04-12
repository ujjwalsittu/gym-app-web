'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Utensils, Droplet, Beef, Wheat } from 'lucide-react'

interface DietPlanData {
  id: string
  name: string
  dailyCalories: number
  protein: number
  carbs: number
  fat: number
  plan: {
    mealPlan?: Array<{
      meal: string
      time: string
      foods: string[]
      calories: number
      protein: number
    }>
    recommendations?: string[]
  }
}

interface DietOverviewProps {
  dietPlan: DietPlanData
}

export function DietOverview({ dietPlan }: DietOverviewProps) {
  const macros = [
    { name: 'Protein', grams: dietPlan.protein, color: 'bg-red-500', icon: Beef },
    { name: 'Carbs', grams: dietPlan.carbs, color: 'bg-yellow-500', icon: Wheat },
    { name: 'Fat', grams: dietPlan.fat, color: 'bg-blue-500', icon: Droplet }
  ]

  const totalMacroGrams = dietPlan.protein + dietPlan.carbs + dietPlan.fat

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Utensils className="h-5 w-5 text-primary" />
          Daily Nutrition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calories */}
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{dietPlan.dailyCalories}</p>
          <p className="text-sm text-muted-foreground">calories per day</p>
        </div>

        {/* Macros */}
        <div className="space-y-4">
          {macros.map((macro) => {
            const percentage = Math.round((macro.grams / totalMacroGrams) * 100)
            const Icon = macro.icon
            
            return (
              <div key={macro.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {macro.name}
                  </span>
                  <span className="font-medium">{macro.grams}g</span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
              </div>
            )
          })}
        </div>

        {/* Meal Plan Preview */}
        {dietPlan.plan.mealPlan && dietPlan.plan.mealPlan.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{"Today's Meals"}</p>
            {dietPlan.plan.mealPlan.slice(0, 4).map((meal, index) => (
              <div 
                key={index}
                className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
              >
                <div>
                  <p className="font-medium">{meal.meal}</p>
                  <p className="text-xs text-muted-foreground">{meal.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{meal.calories} kcal</p>
                  <p className="text-xs text-muted-foreground">{meal.protein}g protein</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
