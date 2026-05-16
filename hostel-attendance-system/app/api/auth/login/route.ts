import { NextResponse } from 'next/server'
import { setAuthCookie } from '@/lib/auth'
import { backendFetch } from '@/lib/backend-client'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { res, data } = await backendFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Invalid email or password' },
        { status: res.status }
      )
    }

    await setAuthCookie(data.token)

    return NextResponse.json({
      message: data.message,
      user: data.user,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
