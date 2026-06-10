import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'
import { backendFetch } from '@/lib/backend-client'

const cameraIndex = Number.parseInt(process.env.SCANNER_CAMERA_INDEX || '0', 10)

async function requireToken() {
  const token = await getAuthToken()
  if (!token) {
    return {
      token: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { token, response: null }
}

export async function GET() {
  try {
    const { token, response } = await requireToken()
    if (response) return response

    const { res, data } = await backendFetch('/ml/attendance-scanner', { token })
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to load scanner status' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get scanner status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, response } = await requireToken()
    if (response) return response

    const body = await request.json().catch(() => ({}))
    const action = body.action === 'stop' ? 'stop' : 'start'
    const durationMinutes = body.durationMinutes === 60 ? 60 : 30

    const { res, data } = await backendFetch(`/ml/attendance-scanner/${action}`, {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cameraIndex: Number.isFinite(cameraIndex) ? cameraIndex : 0,
        durationMinutes,
      }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || `Failed to ${action} scanner` },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update scanner status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
