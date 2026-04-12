import { AuthProvider } from '@/components/auth-provider'

export const metadata = {
  title: 'Workout - VisionaryFit',
  description: 'Track your workout progress'
}

export default function WorkoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
