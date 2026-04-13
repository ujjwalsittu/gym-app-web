'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  onboarding_completed: boolean
  isAdmin?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshSession = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      console.error('Failed to refresh session:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        return { error: data.error || 'Login failed' }
      }
      
      setUser(data.user)
      
      // Redirect based on admin status or onboarding
      if (data.user.isAdmin) {
        router.push('/admin/dashboard')
      } else if (data.user.onboarding_completed) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
      
      return {}
    } catch {
      return { error: 'Network error. Please try again.' }
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        return { error: data.error || 'Registration failed' }
      }
      
      setUser(data.user)
      router.push('/onboarding')
      
      return {}
    } catch {
      return { error: 'Network error. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
