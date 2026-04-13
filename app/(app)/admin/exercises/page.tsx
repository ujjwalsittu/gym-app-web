'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Edit } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  category: string
  equipment: string
  gender: string
  difficulty: string
  is_active: boolean
  has_animation: boolean
}

export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useSWR(
    `/api/admin/exercises/list?search=${search}&category=${category}&limit=20&offset=${page * 20}`,
    (url) => fetch(url).then((res) => res.json())
  )

  useEffect(() => {
    if (data?.exercises) {
      setExercises(data.exercises)
    }
  }, [data])

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Exercises</h1>
        <p className="text-muted-foreground">
          {data?.total || 0} total exercises
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
          <CardDescription>Filter and manage exercise library</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="max-w-sm"
            />
            <Input
              placeholder="Filter by category..."
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(0)
              }}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading exercises...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Category</th>
                    <th className="text-left py-3 px-4 font-medium">Equipment</th>
                    <th className="text-left py-3 px-4 font-medium">Gender</th>
                    <th className="text-left py-3 px-4 font-medium">Difficulty</th>
                    <th className="text-left py-3 px-4 font-medium">Animation</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {exercises.map((exercise) => (
                    <tr key={exercise.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm font-medium">{exercise.name}</td>
                      <td className="py-3 px-4 text-sm">{exercise.category}</td>
                      <td className="py-3 px-4 text-sm">{exercise.equipment}</td>
                      <td className="py-3 px-4 text-sm">{exercise.gender}</td>
                      <td className="py-3 px-4">
                        <Badge className={difficultyColors[exercise.difficulty as keyof typeof difficultyColors] || ''}>
                          {exercise.difficulty}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {exercise.has_animation ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {exercise.is_active ? (
                          <Badge className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && exercises.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No exercises found</div>
          )}

          {data?.total > 0 && (
            <div className="flex gap-2 justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page + 1} of {Math.ceil((data?.total || 1) / 20)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil((data?.total || 1) / 20) - 1}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
