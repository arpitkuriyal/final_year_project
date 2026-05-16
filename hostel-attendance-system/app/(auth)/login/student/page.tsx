import { LoginFormCard } from '@/components/auth/login-form'

export default function StudentLoginPage() {
  return (
    <LoginFormCard
      role="student"
      title="Student Login"
      description="Sign in to view face-recorded attendance and manage grievances."
      footerLink={{ href: '/signup', label: 'Create student account' }}
    />
  )
}
