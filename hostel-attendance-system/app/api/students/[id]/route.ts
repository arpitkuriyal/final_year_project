import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'
import { backendFetch } from '@/lib/backend-client'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { res, data } = await backendFetch(`/students/${id}`, { token })
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Student not found' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get student error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { res, data } = await backendFetch(`/students/${id}`, {
      method: 'DELETE',
      token,
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to delete student' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
