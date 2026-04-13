import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { isUserAdmin } from '@/lib/admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    try {
      const session = await getSession()

      if (!session?.user) {
        // Redirect to login
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      const isAdmin = await isUserAdmin(session.user.id)

      if (!isAdmin) {
        // Redirect non-admin users to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Protect app routes (require authentication)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/workout') || pathname.startsWith('/diet') || pathname.startsWith('/progress') || pathname.startsWith('/settings')) {
    try {
      const session = await getSession()

      if (!session?.user) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/workout/:path*', '/diet/:path*', '/progress/:path*', '/settings/:path*']
}
