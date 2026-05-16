'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'admin'
  roomNumber?: string
  studentId?: string
  block?: string
  branch?: string
  batch?: string
  photoFilename?: string
  augmentCount?: number
}

export interface SignupData {
  name: string
  email: string
  password: string
  roomNumber: string
  studentId: string
  block: string
  branch: string
  batch: string
  photo: File
}

export type LoginRole = 'student' | 'admin'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (
    email: string,
    password: string,
    expectedRole: LoginRole
  ) => Promise<{ success: boolean; error?: string }>
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string, expectedRole: LoginRole) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' }
      }

      if (data.user.role !== expectedRole) {
        const portal = expectedRole === 'admin' ? 'warden' : 'student'
        return {
          success: false,
          error: `This account is not a ${portal}. Use the correct login page.`,
        }
      }

      setUser(data.user)
      router.push(expectedRole === 'admin' ? '/admin' : '/student')
      return { success: true }
    } catch {
      return { success: false, error: 'An error occurred' }
    }
  }

  const signup = async (data: SignupData) => {
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('room_number', data.roomNumber)
      formData.append('student_id', data.studentId)
      formData.append('block', data.block)
      formData.append('branch', data.branch)
      formData.append('batch', data.batch)
      formData.append('photo', data.photo)

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
      })

      const responseData = await res.json()

      if (!res.ok) {
        return { success: false, error: responseData.error || 'Signup failed' }
      }

      setUser(responseData.user)
      router.push('/student')

      return { success: true }
    } catch {
      return { success: false, error: 'An error occurred' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
