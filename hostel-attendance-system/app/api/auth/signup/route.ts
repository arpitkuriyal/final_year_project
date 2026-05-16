import { NextResponse } from 'next/server'
import { setAuthCookie } from '@/lib/auth'
import { getBackendUrl } from '@/lib/backend-client'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const res = await fetch(getBackendUrl('/auth/signup'), {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Signup failed' },
        { status: res.status }
      )
    }

    await setAuthCookie(data.token)

    return NextResponse.json({
      message: data.message,
      user: data.user,
      ml: data.ml,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
