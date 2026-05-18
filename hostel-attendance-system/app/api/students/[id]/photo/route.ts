import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'
import { getBackendUrl } from '@/lib/backend-client'

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
    const res = await fetch(getBackendUrl(`/students/${id}/photo`), {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Photo not found' }, { status: res.status })
    }

    const blob = await res.blob()
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    return new NextResponse(blob, { headers: { 'Content-Type': contentType } })
  } catch (error) {
    console.error('Student photo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
