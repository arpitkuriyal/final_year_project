import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { backendFetch } from './backend-client'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'hostel-management-secret-key-2024'
)

const COOKIE_NAME = 'auth-token'

export interface JWTPayload {
  userId: string
  email: string
  role: 'student' | 'admin'
}

export interface User {
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

export async function createToken(user: {
  id: string
  email: string
  role: 'student' | 'admin'
}): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET)

  return token
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value || null
}

function mapBackendUser(user: Record<string, unknown>): User {
  return {
    id: user.id as string,
    name: user.name as string,
    email: user.email as string,
    role: user.role as 'student' | 'admin',
    roomNumber: (user.roomNumber as string) || undefined,
    studentId: (user.studentId as string) || undefined,
    block: (user.block as string) || undefined,
    branch: (user.branch as string) || undefined,
    batch: (user.batch as string) || undefined,
    photoFilename: (user.photoFilename as string) || undefined,
    augmentCount: (user.augmentCount as number) || 0,
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getAuthToken()
  if (!token) return null

  const { res, data } = await backendFetch('/auth/me', { token })
  if (!res.ok) return null
  return mapBackendUser(data.user)
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    throw new Error('Forbidden')
  }
  return user
}

export async function requireStudent(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== 'student') {
    throw new Error('Forbidden')
  }
  return user
}
