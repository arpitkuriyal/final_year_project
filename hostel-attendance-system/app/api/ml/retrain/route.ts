import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'
import { backendFetch } from '@/lib/backend-client'

export async function POST() {
  try {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { res, data } = await backendFetch('/ml/retrain-async', {
      method: 'POST',
      token,
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Retrain failed' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
