import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { isUserAdmin } from '@/lib/admin'

const PUBLIC_PATHS = ['/login', '/register']
const PROTECTED_PREFIXES = ['/dashboard', '/workout', '/diet', '/progress', '/settings', '/onboarding', '/workout-plan']
const ADMIN_PREFIX = '/admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect logged-in users away from auth pages (login/register)
  if (PUBLIC_PATHS.includes(pathname)) {
    try {
      const session = await getSession()
      if (session?.user) {
        const isAdmin = await isUserAdmin(session.user.id)
        if (isAdmin) return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        if (session.user.onboarding_completed) return NextResponse.redirect(new URL('/dashboard', request.url))
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    } catch {
      // Not logged in, allow through to login page
    }
    return NextResponse.next()
  }

  // Protect admin routes
  if (pathname.startsWith(ADMIN_PREFIX)) {
    try {
      const session = await getSession()
      if (!session?.user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
      const isAdmin = await isUserAdmin(session.user.id)
      if (!isAdmin) return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Protect app routes
  if (PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    try {
      const session = await getSession()
      if (!session?.user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/admin/:path*',
    '/dashboard/:path*',
    '/workout/:path*',
    '/workout-plan/:path*',
    '/diet/:path*',
    '/progress/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
  ]
}
