import { AuthProvider } from '@/components/auth/auth-provider'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </AuthProvider>
  )
}
