'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Shield, ShieldOff } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  created_at: string
  is_admin: boolean
  workouts: number
  photos: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const { data, isLoading } = useSWR('/api/admin/users', (url) =>
    fetch(url).then((res) => res.json())
  )

  useEffect(() => {
    if (data?.users) {
      setUsers(data.users)
    }
  }, [data])

  const handleToggleAdmin = async (userId: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'toggle_admin' })
      })

      if (!response.ok) throw new Error('Failed to toggle admin')

      const result = await response.json()
      toast({
        title: 'Success',
        description: result.message
      })

      // Refresh data
      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, is_admin: !u.is_admin } : u
      )
      setUsers(updatedUsers)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user admin status',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure? This will permanently delete the user and all their data.')) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'delete_user' })
      })

      if (!response.ok) throw new Error('Failed to delete user')

      toast({
        title: 'Success',
        description: 'User deleted successfully'
      })

      setUsers(users.filter((u) => u.id !== userId))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="text-muted-foreground">View and manage all registered users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Search and manage user accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Joined</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Workouts</th>
                    <th className="text-left py-3 px-4 font-medium">Photos</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">{user.email}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {user.is_admin ? (
                          <Badge className="bg-purple-600">Admin</Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{user.workouts}</td>
                      <td className="py-3 px-4 text-sm">{user.photos}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAdmin(user.id)}
                            disabled={loading}
                          >
                            {user.is_admin ? (
                              <ShieldOff className="h-4 w-4" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
