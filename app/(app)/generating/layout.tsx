import { AuthProvider } from '@/components/auth-provider'

export const metadata = {
  title: 'Generating Your Plan - VisionaryFit',
  description: 'Creating your personalized fitness plan'
}

export default function GeneratingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
