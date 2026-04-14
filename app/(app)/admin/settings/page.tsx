'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, CheckCircle, Save, Settings, Database, Bell, Shield } from 'lucide-react'

interface AdminSettings {
  max_exercises_per_day: number
  enable_telegram_notifications: boolean
  enable_email_notifications: boolean
  max_users: number
  maintenance_mode: boolean
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>({
    max_exercises_per_day: 10,
    enable_telegram_notifications: false,
    enable_email_notifications: true,
    max_users: 1000,
    maintenance_mode: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 py-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Configure system-wide application settings</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">Settings saved successfully</p>
        </div>
      )}

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Workout Settings
            </CardTitle>
            <CardDescription>Configure exercise and workout limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="max-exercises">Max Exercises Per Day</Label>
              <Input
                id="max-exercises"
                type="number"
                value={settings.max_exercises_per_day}
                onChange={(e) => setSettings({ ...settings, max_exercises_per_day: parseInt(e.target.value) || 10 })}
                min={1}
                max={50}
              />
              <p className="text-xs text-muted-foreground">Maximum exercises users can add in a single day</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="max-users">Max Users</Label>
              <Input
                id="max-users"
                type="number"
                value={settings.max_users}
                onChange={(e) => setSettings({ ...settings, max_users: parseInt(e.target.value) || 1000 })}
                min={1}
              />
              <p className="text-xs text-muted-foreground">Maximum number of users allowed on the platform</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>Manage system status and maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Disable access for non-admin users</p>
              </div>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenance_mode: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Enable or disable notification services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send email updates to users</p>
              </div>
              <Switch
                checked={settings.enable_email_notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enable_email_notifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Telegram Notifications</Label>
                <p className="text-sm text-muted-foreground">Send Telegram messages to users</p>
              </div>
              <Switch
                checked={settings.enable_telegram_notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enable_telegram_notifications: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
