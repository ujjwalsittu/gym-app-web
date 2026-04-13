'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react'

const BODY_PARTS = ['ABS', 'ARMS', 'BACK', 'CHEST', 'LEGS', 'SHOULDERS', 'CARDIO']
const EQUIPMENT = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Band', 'Kettlebell']
const GENDERS = ['Men', 'Women']

export default function ExerciseManagementPage() {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'CHEST',
    equipment: 'Dumbbell',
    gender: 'Men',
    difficulty: 'intermediate'
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddExercise = async () => {
    if (!formData.name.trim()) {
      alert('Please enter exercise name')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/exercises/manual-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        setExercises([...exercises, result.exercise])
        setFormData({
          name: '',
          category: 'CHEST',
          equipment: 'Dumbbell',
          gender: 'Men',
          difficulty: 'intermediate'
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add exercise')
      }
    } catch (error) {
      alert('Error adding exercise')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExercise = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return

    try {
      const response = await fetch('/api/admin/exercises/manual-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        setExercises(exercises.filter(ex => ex.id !== id))
      } else {
        alert('Failed to delete exercise')
      }
    } catch (error) {
      alert('Error deleting exercise')
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Manage Exercises</h1>
        <p className="text-muted-foreground mb-6">
          Add, edit, or delete exercises manually. Fill in the form below to add a new exercise.
        </p>

        {/* Form Card */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Exercise</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Exercise Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Bench Press"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Body Part *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                {BODY_PARTS.map(part => (
                  <option key={part} value={part}>{part}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Equipment *</label>
              <select
                name="equipment"
                value={formData.equipment}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                {EQUIPMENT.map(equip => (
                  <option key={equip} value={equip}>{equip}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                {GENDERS.map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <Button onClick={handleAddExercise} disabled={loading} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {loading ? 'Adding...' : 'Add Exercise'}
          </Button>
        </Card>

        {/* Success Message */}
        {exercises.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-900">{exercises.length} exercise(s) added successfully</p>
          </div>
        )}

        {/* Exercises List */}
        {exercises.length > 0 && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Exercise</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Body Part</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Equipment</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Gender</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Difficulty</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exercises.map((exercise) => (
                    <tr key={exercise.id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{exercise.name}</td>
                      <td className="px-4 py-3 text-sm">{exercise.category}</td>
                      <td className="px-4 py-3 text-sm">{exercise.equipment}</td>
                      <td className="px-4 py-3 text-sm">{exercise.gender}</td>
                      <td className="px-4 py-3 text-sm capitalize">{exercise.difficulty}</td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExercise(exercise.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {exercises.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No exercises added yet</p>
            <p className="text-xs text-muted-foreground">Use the form above to add exercises manually</p>
          </Card>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">For bulk upload:</span> Use the Lottie Upload page to upload ZIP files with animated exercises.
          </p>
        </div>
      </div>
    </div>
  )
}
