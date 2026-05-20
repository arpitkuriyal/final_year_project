'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Camera, Loader2, Eye, EyeOff } from 'lucide-react'

const signupSchema = z.object({
  studentId: z.string().min(3, 'Student ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roomNumber: z.string().min(1, 'Room number is required'),
  block: z.string().min(1, 'Wing is required'),
  branch: z.string().min(1, 'Branch is required'),
  batch: z.string().min(1, 'Batch is required'),
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const { signup } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      block: 'A',
      branch: 'CSE',
      batch: '2026',
    },
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: SignupForm) => {
    if (!photo) {
      setError('Please upload a clear face photo for attendance recognition.')
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await signup({ ...data, photo })

    if (!result.success) {
      setError(result.error || 'Signup failed')
    }

    setIsLoading(false)
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-4 pb-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary">
          <Building2 className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Hostel Registration</CardTitle>
          <CardDescription>
            Sign up with your details and face photo. Photos are augmented for the ML attendance model.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input id="studentId" placeholder="e.g. 58901" {...register('studentId')} />
              {errors.studentId && (
                <p className="text-sm text-destructive">{errors.studentId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number</Label>
              <Input id="roomNumber" placeholder="e.g. 101" {...register('roomNumber')} />
              {errors.roomNumber && (
                <p className="text-sm text-destructive">{errors.roomNumber.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Enter your full name" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="block">Wing</Label>
              <Input id="block" placeholder="1 Wing" {...register('block')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input id="branch" placeholder="CSE" {...register('branch')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Input id="batch" placeholder="2026" {...register('batch')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                {...register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Face Photo</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                {photo ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Face preview"
                  className="h-24 w-24 rounded-lg border object-cover"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Use a well-lit front-facing photo. The system saves it and generates 20 augmented variants for training.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Register & Process Face
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login/student" className="text-primary underline-offset-4 hover:underline">
              Student sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
