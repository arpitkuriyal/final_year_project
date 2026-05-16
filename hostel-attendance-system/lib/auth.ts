import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { dbHelpers, type User } from './mock-data'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'hostel-management-secret-key-2024'
)

const COOKIE_NAME = 'auth-token'

export interface JWTPayload {
  userId: string
  email: string
  role: 'student' | 'admin'
}

export async function createToken(user: User): Promise<string> {
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
    maxAge: 60 * 60 * 24 * 7, // 7 days
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

export async function getCurrentUser(): Promise<User | null> {
  const token = await getAuthToken()
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  const user = dbHelpers.findUserById(payload.userId)
  if (!user) return null

  // Return user without password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword as User
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
