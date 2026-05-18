import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'
import { getBackendUrl } from '@/lib/backend-client'

export async function GET() {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await fetch(getBackendUrl('/hostel-attendance/admin/export'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json(
        { error: text || 'Failed to export attendance' },
        { status: res.status }
      )
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition':
          res.headers.get('Content-Disposition') ||
          'attachment; filename="hostel-attendance-last-30-days.csv"',
      },
    })
  } catch (error) {
    console.error('Export attendance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
