import { AuthProvider } from '@/components/auth-provider'

export const metadata = {
  title: 'Onboarding - VisionaryFit',
  description: 'Set up your personalized fitness profile'
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
