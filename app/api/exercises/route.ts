import { NextResponse } from 'next/server'
import { exerciseLibrary, Exercise } from '@/lib/exercise-library'

type ExerciseCategory = Exercise['category']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''
    const category = searchParams.get('category') as ExerciseCategory | null
    const muscleGroup = searchParams.get('muscle')?.toLowerCase()
    const equipment = searchParams.get('equipment')?.toLowerCase()
    const difficulty = searchParams.get('difficulty')

    let exercises = [...exerciseLibrary]

    // Filter by search query
    if (query) {
      exercises = exercises.filter(ex => 
        ex.name.toLowerCase().includes(query) ||
        ex.description.toLowerCase().includes(query) ||
        ex.muscleGroups.some(m => m.toLowerCase().includes(query))
      )
    }

    // Filter by category
    if (category) {
      exercises = exercises.filter(ex => ex.category === category)
    }

    // Filter by muscle group
    if (muscleGroup) {
      exercises = exercises.filter(ex => 
        ex.muscleGroups.some(m => m.toLowerCase().includes(muscleGroup))
      )
    }

    // Filter by equipment
    if (equipment) {
      if (equipment === 'none') {
        exercises = exercises.filter(ex => 
          ex.equipment.length === 0 || ex.equipment.includes('None')
        )
      } else {
        exercises = exercises.filter(ex => 
          ex.equipment.some(e => e.toLowerCase().includes(equipment))
        )
      }
    }

    // Filter by difficulty
    if (difficulty) {
      exercises = exercises.filter(ex => ex.difficulty === difficulty)
    }

    // Get unique values for filters
    const categories = [...new Set(exerciseLibrary.map(ex => ex.category))]
    const muscleGroups = [...new Set(exerciseLibrary.flatMap(ex => ex.muscleGroups))]
    const equipmentList = [...new Set(exerciseLibrary.flatMap(ex => ex.equipment))]
    const difficulties = ['beginner', 'intermediate', 'advanced']

    return NextResponse.json({
      exercises,
      total: exercises.length,
      filters: {
        categories,
        muscleGroups: muscleGroups.sort(),
        equipment: equipmentList.sort(),
        difficulties
      }
    })
  } catch (error) {
    console.error('Exercises fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
  }
}
