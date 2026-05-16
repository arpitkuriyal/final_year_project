import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'
import { backendFetch } from '@/lib/backend-client'

export async function GET() {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { res, data } = await backendFetch('/hostel-attendance', { token })
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to load attendance' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get attendance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { res, data } = await backendFetch('/hostel-attendance', {
      method: 'POST',
      token,
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to mark attendance' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Mark attendance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
