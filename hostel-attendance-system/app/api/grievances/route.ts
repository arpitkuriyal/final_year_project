import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'
import { backendFetch } from '@/lib/backend-client'

export async function GET() {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { res, data } = await backendFetch('/grievances', { token })
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to load grievances' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get grievances error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { res, data } = await backendFetch('/grievances', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to submit grievance' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Create grievance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
