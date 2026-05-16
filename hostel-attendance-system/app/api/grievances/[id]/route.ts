import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'
import { backendFetch } from '@/lib/backend-client'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { status, adminReply } = await request.json()

    const { res, data } = await backendFetch(`/grievances/${id}`, {
      method: 'PATCH',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        admin_reply: adminReply,
      }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Update failed' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update grievance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
