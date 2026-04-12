'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Ruler,
  Scale,
  Save,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const MEASUREMENT_TYPES = [
  { id: 'weight', label: 'Weight', unit: 'kg', icon: Scale },
  { id: 'chest', label: 'Chest', unit: 'cm', icon: Ruler },
  { id: 'waist', label: 'Waist', unit: 'cm', icon: Ruler },
  { id: 'hips', label: 'Hips', unit: 'cm', icon: Ruler },
  { id: 'biceps_left', label: 'Left Bicep', unit: 'cm', icon: Ruler },
  { id: 'biceps_right', label: 'Right Bicep', unit: 'cm', icon: Ruler },
  { id: 'thigh_left', label: 'Left Thigh', unit: 'cm', icon: Ruler },
  { id: 'thigh_right', label: 'Right Thigh', unit: 'cm', icon: Ruler },
  { id: 'calf_left', label: 'Left Calf', unit: 'cm', icon: Ruler },
  { id: 'calf_right', label: 'Right Calf', unit: 'cm', icon: Ruler },
  { id: 'neck', label: 'Neck', unit: 'cm', icon: Ruler },
  { id: 'forearm_left', label: 'Left Forearm', unit: 'cm', icon: Ruler },
  { id: 'forearm_right', label: 'Right Forearm', unit: 'cm', icon: Ruler },
]

export default function MeasurementsPage() {
  const router = useRouter()
  const { data, isLoading, error } = useSWR('/api/measurements', fetcher)
  
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [selectedType, setSelectedType] = useState('weight')

  const handleSave = async () => {
    setSaving(true)
    try {
      const measurements: Record<string, number> = {}
      for (const [key, value] of Object.entries(formData)) {
        if (value) {
          measurements[key] = parseFloat(value)
        }
      }

      await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurements, notes }),
      })

      mutate('/api/measurements')
      setShowForm(false)
      setFormData({})
      setNotes('')
    } catch (error) {
      console.error('Failed to save measurements:', error)
    } finally {
      setSaving(false)
    }
  }

  const getLatestValue = (type: string) => {
    if (!data?.latest) return null
    const measurement = data.latest.find((m: any) => m.measurement_type === type)
    return measurement?.value
  }

  const getChange = (type: string) => {
    if (!data?.changes) return null
    return data.changes[type]
  }

  const getChartData = (type: string) => {
    if (!data?.measurements) return []
    return data.measurements
      .filter((m: any) => m.measurement_type === type)
      .map((m: any) => ({
        date: new Date(m.measured_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: m.value,
      }))
      .reverse()
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
          <h1 className="text-lg font-semibold">Body Measurements</h1>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" />
            Log
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        {/* Add Measurements Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Log Measurements</CardTitle>
              <CardDescription>Enter your current measurements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {MEASUREMENT_TYPES.map((type) => (
                  <div key={type.id} className="space-y-1">
                    <Label className="text-xs">{type.label}</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder={getLatestValue(type.id)?.toString() || '0'}
                        value={formData[type.id] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [type.id]: e.target.value }))}
                        className="pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {type.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add any notes about your measurements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleSave}
                disabled={saving || Object.keys(formData).length === 0}
              >
                {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                Save Measurements
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Stats Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Stats</CardTitle>
            <CardDescription>
              {data?.hasBaseline ? '30-day change shown' : 'Start tracking to see progress'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {MEASUREMENT_TYPES.slice(0, 6).map((type) => {
                const value = getLatestValue(type.id)
                const change = getChange(type.id)
                const Icon = type.icon

                return (
                  <div 
                    key={type.id}
                    className="rounded-lg bg-secondary/50 p-3 text-center cursor-pointer hover:bg-secondary/70 transition-colors"
                    onClick={() => setSelectedType(type.id)}
                  >
                    <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-bold">
                      {value ? `${value}` : '--'}
                    </p>
                    <p className="text-xs text-muted-foreground">{type.label}</p>
                    {change !== null && change !== undefined && (
                      <div className={`mt-1 flex items-center justify-center gap-0.5 text-xs ${
                        change > 0 
                          ? type.id === 'weight' || type.id === 'waist' ? 'text-red-500' : 'text-green-500'
                          : change < 0
                            ? type.id === 'weight' || type.id === 'waist' ? 'text-green-500' : 'text-red-500'
                            : 'text-muted-foreground'
                      }`}>
                        {change > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : change < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        <span>{Math.abs(change).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Chart</CardTitle>
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="weight">Weight</TabsTrigger>
                <TabsTrigger value="chest">Chest</TabsTrigger>
                <TabsTrigger value="waist">Waist</TabsTrigger>
                <TabsTrigger value="biceps_left">Bicep</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {getChartData(selectedType).length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData(selectedType)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 10 }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Ruler className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>No data yet</p>
                  <p className="text-sm">Log your first measurement to see the chart</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Measurements */}
        <Card>
          <CardHeader>
            <CardTitle>All Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MEASUREMENT_TYPES.map((type) => {
                const value = getLatestValue(type.id)
                const change = getChange(type.id)

                return (
                  <div 
                    key={type.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <type.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {value ? `Last: ${value} ${type.unit}` : 'Not measured'}
                        </p>
                      </div>
                    </div>
                    {change !== null && change !== undefined && (
                      <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                        change > 0 
                          ? type.id === 'weight' || type.id === 'waist' 
                            ? 'bg-red-500/10 text-red-500' 
                            : 'bg-green-500/10 text-green-500'
                          : change < 0
                            ? type.id === 'weight' || type.id === 'waist' 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-red-500/10 text-red-500'
                            : 'bg-secondary text-muted-foreground'
                      }`}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)} {type.unit}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Measurement Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Consistency:</strong> Measure at the same time of day, ideally in the morning</p>
            <p><strong>Frequency:</strong> Weekly measurements are ideal to track progress</p>
            <p><strong>Technique:</strong> Keep the tape measure level and snug, but not tight</p>
            <p><strong>Flexed vs Relaxed:</strong> Measure arms flexed, other body parts relaxed</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
