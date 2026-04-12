import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function HomePage() {
  const session = await getSession()

  if (session) {
    if (session.user.onboarding_completed) {
      redirect('/dashboard')
    } else {
      redirect('/onboarding')
    }
  }

  redirect('/login')
}
