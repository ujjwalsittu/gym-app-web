import { AuthProvider } from '@/components/auth-provider'

export const metadata = {
  title: 'Dashboard - VisionaryFit',
  description: 'Your personalized fitness dashboard'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
