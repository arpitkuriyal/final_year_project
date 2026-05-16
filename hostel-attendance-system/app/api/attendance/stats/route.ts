import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dbHelpers } from '@/lib/mock-data'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stats = dbHelpers.getAttendanceStats(user.id)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Get attendance stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
