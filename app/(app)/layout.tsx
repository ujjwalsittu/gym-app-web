export const dynamic = 'force-dynamic'

import { AuthProvider } from '@/components/auth-provider'
import { PushNotificationProvider } from '@/components/push-notification-provider'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <PushNotificationProvider>
        {children}
      </PushNotificationProvider>
    </AuthProvider>
  )
}
