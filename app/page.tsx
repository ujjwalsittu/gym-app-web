import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { isUserAdmin } from '@/lib/admin'

export default async function HomePage() {
  const session = await getSession()

  if (session?.user) {
    const isAdmin = await isUserAdmin(session.user.id)
    if (isAdmin) redirect('/admin/dashboard')
    if (session.user.onboarding_completed) redirect('/dashboard')
    redirect('/onboarding')
  }

  redirect('/login')
}
