import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'
import { backendFetch } from '@/lib/backend-client'

export async function GET() {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { res, data } = await backendFetch('/students', { token })
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to load students' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
