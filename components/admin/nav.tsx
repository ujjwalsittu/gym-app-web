'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Dumbbell, Upload, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const adminNav = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/exercises', icon: Dumbbell, label: 'Exercises' },
  { href: '/admin/lottie-manage', icon: Upload, label: 'Upload Lottie' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' }
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-4 border-b mb-6">
      {adminNav.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
