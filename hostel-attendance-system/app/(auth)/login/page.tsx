import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, GraduationCap, Shield } from 'lucide-react'

export default function LoginChooserPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary">
          <Building2 className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Hostel Portal</h1>
        <p className="text-sm text-muted-foreground">Choose how you want to sign in</p>
      </div>

      <div className="grid gap-4">
        <Card className="border-2 transition-colors hover:border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
              Student
            </CardTitle>
            <CardDescription>
              View attendance and grievances. Marking is only via the hostel face scanner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <Link href="/login/student">Student Login</Link>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              New resident?{' '}
              <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
                Register with face photo
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 transition-colors hover:border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Warden
            </CardTitle>
            <CardDescription>
              Manage students, grievances, and face attendance records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full" size="lg">
              <Link href="/login/warden">Warden Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
