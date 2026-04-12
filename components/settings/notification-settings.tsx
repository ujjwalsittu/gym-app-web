'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Bell, BellOff, Droplets, Dumbbell, Footprints, Utensils, Save, Loader2 } from 'lucide-react'
import {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  checkNotificationPermission,
  requestNotificationPermission
} from '@/lib/push-notifications'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: settings, mutate } = useSWR('/api/reminders', fetcher)

  const [localSettings, setLocalSettings] = useState({
    water_reminder: true,
    water_interval_minutes: 60,
    workout_reminder: true,
    workout_time: '07:00',
    walk_reminder: true,
    walk_interval_hours: 2,
    meal_reminders: true,
    meal_times: ['08:00', '13:00', '19:00']
  })

  useEffect(() => {
    if (settings && !settings.error) {
      setLocalSettings(settings)
    }
  }, [settings])

  useEffect(() => {
    checkNotificationPermission().then(setPermission)
    
    // Check if already subscribed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub)
        })
      })
    }
  }, [])

  const enableNotifications = async () => {
    setLoading(true)
    try {
      const perm = await requestNotificationPermission()
      setPermission(perm)

      if (perm === 'granted') {
        await registerServiceWorker()
        const subscription = await subscribeToPush()
        setSubscribed(!!subscription)
      }
    } catch (error) {
      console.error('Enable notifications failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const disableNotifications = async () => {
    setLoading(true)
    try {
      await unsubscribeFromPush()
      setSubscribed(false)
    } catch (error) {
      console.error('Disable notifications failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings)
      })
      await mutate()
    } catch (error) {
      console.error('Save settings failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: string, value: unknown) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateMealTime = (index: number, time: string) => {
    const newTimes = [...localSettings.meal_times]
    newTimes[index] = time
    updateSetting('meal_times', newTimes)
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {subscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get reminders for water, workouts, and meals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permission === 'denied' ? (
            <div className="text-sm text-destructive">
              Notifications are blocked. Please enable them in your browser settings.
            </div>
          ) : subscribed ? (
            <Button 
              variant="outline" 
              onClick={disableNotifications}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Disable Notifications
            </Button>
          ) : (
            <Button onClick={enableNotifications} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
              Enable Notifications
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      {subscribed && (
        <>
          {/* Water Reminders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  Water Reminders
                </CardTitle>
                <Switch
                  checked={localSettings.water_reminder}
                  onCheckedChange={(checked) => updateSetting('water_reminder', checked)}
                />
              </div>
            </CardHeader>
            {localSettings.water_reminder && (
              <CardContent>
                <div className="space-y-4">
                  <Label>Remind every {localSettings.water_interval_minutes} minutes</Label>
                  <Slider
                    value={[localSettings.water_interval_minutes]}
                    onValueChange={([val]) => updateSetting('water_interval_minutes', val)}
                    min={15}
                    max={180}
                    step={15}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>15 min</span>
                    <span>3 hours</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Workout Reminders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Workout Reminders
                </CardTitle>
                <Switch
                  checked={localSettings.workout_reminder}
                  onCheckedChange={(checked) => updateSetting('workout_reminder', checked)}
                />
              </div>
            </CardHeader>
            {localSettings.workout_reminder && (
              <CardContent>
                <div className="space-y-2">
                  <Label>Daily workout time</Label>
                  <Input
                    type="time"
                    value={localSettings.workout_time}
                    onChange={(e) => updateSetting('workout_time', e.target.value)}
                    className="w-32"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Walk Reminders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Footprints className="h-5 w-5 text-green-500" />
                  Walk Reminders
                </CardTitle>
                <Switch
                  checked={localSettings.walk_reminder}
                  onCheckedChange={(checked) => updateSetting('walk_reminder', checked)}
                />
              </div>
            </CardHeader>
            {localSettings.walk_reminder && (
              <CardContent>
                <div className="space-y-4">
                  <Label>Remind every {localSettings.walk_interval_hours} hours</Label>
                  <Slider
                    value={[localSettings.walk_interval_hours]}
                    onValueChange={([val]) => updateSetting('walk_interval_hours', val)}
                    min={1}
                    max={4}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 hour</span>
                    <span>4 hours</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Meal Reminders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Utensils className="h-5 w-5 text-amber-500" />
                  Meal Reminders
                </CardTitle>
                <Switch
                  checked={localSettings.meal_reminders}
                  onCheckedChange={(checked) => updateSetting('meal_reminders', checked)}
                />
              </div>
            </CardHeader>
            {localSettings.meal_reminders && (
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Label className="w-20">Breakfast</Label>
                    <Input
                      type="time"
                      value={localSettings.meal_times[0]}
                      onChange={(e) => updateMealTime(0, e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="w-20">Lunch</Label>
                    <Input
                      type="time"
                      value={localSettings.meal_times[1]}
                      onChange={(e) => updateMealTime(1, e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="w-20">Dinner</Label>
                    <Input
                      type="time"
                      value={localSettings.meal_times[2]}
                      onChange={(e) => updateMealTime(2, e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Save Button */}
          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </>
      )}
    </div>
  )
}
