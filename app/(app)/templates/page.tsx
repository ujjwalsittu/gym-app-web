'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft, 
  Plus, 
  Search,
  Star,
  Clock,
  Dumbbell,
  Users,
  Copy,
  Play,
  Filter,
  Zap,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'hiit', label: 'HIIT' },
  { id: 'full_body', label: 'Full Body' },
  { id: 'upper_body', label: 'Upper' },
  { id: 'lower_body', label: 'Lower' },
  { id: 'core', label: 'Core' },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-500',
  intermediate: 'bg-yellow-500/10 text-yellow-500',
  advanced: 'bg-red-500/10 text-red-500',
}

export default function TemplatesPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  
  const { data, isLoading } = useSWR(
    `/api/templates?filter=${filter}&category=${category}&search=${search}`,
    fetcher
  )

  const handleDuplicate = async (id: string) => {
    try {
      await fetch(`/api/templates/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' }),
      })
      mutate(`/api/templates?filter=${filter}&category=${category}&search=${search}`)
    } catch (error) {
      console.error('Failed to duplicate:', error)
    }
  }

  const handleUse = async (id: string) => {
    try {
      await fetch(`/api/templates/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'use' }),
      })
      router.push(`/workout/start?template=${id}`)
    } catch (error) {
      console.error('Failed to use template:', error)
    }
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
          <h1 className="text-lg font-semibold">Workout Templates</h1>
          <Link href="/templates/create">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="my">My Templates</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={category === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat.id)}
              className="flex-shrink-0"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Templates List */}
        <div className="space-y-3">
          {data?.templates?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">No Templates Found</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'my' 
                    ? 'Create your first workout template' 
                    : 'Try adjusting your filters'}
                </p>
                {filter === 'my' && (
                  <Link href="/templates/create">
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Template
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            data?.templates?.map((template: any) => (
              <Card key={template.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        {template.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <Badge className={DIFFICULTY_COLORS[template.difficulty] || 'bg-secondary'}>
                        {template.difficulty}
                      </Badge>
                    </div>

                    {/* Meta Info */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.estimated_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="h-3 w-3" />
                        {template.exercises?.length || 0} exercises
                      </span>
                      {template.avg_rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {Number(template.avg_rating).toFixed(1)}
                          <span className="text-muted-foreground/70">
                            ({template.rating_count})
                          </span>
                        </span>
                      )}
                      {template.use_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {template.use_count} uses
                        </span>
                      )}
                    </div>

                    {/* Creator */}
                    {template.creator_name && filter !== 'my' && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        by {template.creator_name}
                      </p>
                    )}

                    {/* Tags */}
                    {template.tags && template.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {template.tags.slice(0, 4).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-border">
                    <Button
                      variant="ghost"
                      className="flex-1 rounded-none"
                      onClick={() => handleDuplicate(template.id)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </Button>
                    <div className="w-px bg-border" />
                    <Button
                      variant="ghost"
                      className="flex-1 rounded-none"
                      onClick={() => handleUse(template.id)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Stats */}
        {filter === 'my' && data?.templates?.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Your Templates Stats</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold">{data.templates.length}</p>
                  <p className="text-xs text-muted-foreground">Templates</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {data.templates.reduce((acc: number, t: any) => acc + (t.use_count || 0), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Uses</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {data.templates.filter((t: any) => t.is_public).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Shared</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
