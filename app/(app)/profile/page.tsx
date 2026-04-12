'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import { NotificationSettings } from '@/components/settings/notification-settings'
import { Spinner } from '@/components/ui/spinner'
import { 
  User, Settings, Bell, Camera, LogOut, 
  Save, Loader2, Scale, Ruler, Target, Activity
} from 'lucide-react'
import useSWR from 'swr'
import Image from 'next/image'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const [saving, setSaving] = useState(false)

  const { data, isLoading, mutate } = useSWR(
    user ? '/api/profile' : null,
    fetcher
  )

  const [formData, setFormData] = useState({
    name: '',
    weight_kg: '',
    height_cm: '',
    target_weight_kg: '',
    fitness_goal: '',
    activity_level: ''
  })

  useEffect(() => {
    if (data?.profile) {
      setFormData({
        name: data.profile.name || '',
        weight_kg: data.profile.weight_kg?.toString() || '',
        height_cm: data.profile.height_cm?.toString() || '',
        target_weight_kg: data.profile.target_weight_kg?.toString() || '',
        fitness_goal: data.profile.fitness_goal || '',
        activity_level: data.profile.activity_level || ''
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
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          profile: {
            weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
            height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
            target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
            fitness_goal: formData.fitness_goal,
            activity_level: formData.activity_level
          }
        })
      })
      await mutate()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const profile = data?.profile

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 p-4">
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">{profile?.name || 'User'}</h2>
            <p className="text-sm text-muted-foreground">
              Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Body Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="flex items-center gap-1">
                      <Scale className="h-4 w-4" />
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                      placeholder="70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height" className="flex items-center gap-1">
                      <Ruler className="h-4 w-4" />
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height_cm}
                      onChange={(e) => setFormData(prev => ({ ...prev, height_cm: e.target.value }))}
                      placeholder="175"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target" className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Target Weight (kg)
                  </Label>
                  <Input
                    id="target"
                    type="number"
                    step="0.1"
                    value={formData.target_weight_kg}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_weight_kg: e.target.value }))}
                    placeholder="65"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fitness Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Fitness Goal</Label>
                  <select
                    value={formData.fitness_goal}
                    onChange={(e) => setFormData(prev => ({ ...prev, fitness_goal: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select goal</option>
                    <option value="lose_weight">Lose Weight</option>
                    <option value="build_muscle">Build Muscle</option>
                    <option value="maintain">Maintain Fitness</option>
                    <option value="improve_endurance">Improve Endurance</option>
                    <option value="increase_strength">Increase Strength</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    Activity Level
                  </Label>
                  <select
                    value={formData.activity_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, activity_level: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select level</option>
                    <option value="sedentary">Sedentary</option>
                    <option value="lightly_active">Lightly Active</option>
                    <option value="moderately_active">Moderately Active</option>
                    <option value="very_active">Very Active</option>
                    <option value="extremely_active">Extremely Active</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress Photos</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.photos?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {data.photos.map((photo: { id: string; photo_type: string; blob_pathname: string; created_at: string }) => (
                      <div key={photo.id} className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
                        <Image
                          src={`/api/file?pathname=${encodeURIComponent(photo.blob_pathname)}`}
                          alt={photo.photo_type}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-xs capitalize text-white">{photo.photo_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No progress photos yet
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => router.push('/onboarding')}>
                      Add Photos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  )
}
