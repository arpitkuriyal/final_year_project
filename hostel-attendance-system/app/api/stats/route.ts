import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dbHelpers } from '@/lib/mock-data'

// GET - Get admin dashboard stats
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stats = dbHelpers.getAdminStats()

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
