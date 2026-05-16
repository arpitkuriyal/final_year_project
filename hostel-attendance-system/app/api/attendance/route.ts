import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dbHelpers } from '@/lib/mock-data'

// GET - Get attendance history
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const records = dbHelpers.getAttendanceByStudent(user.id)
    const stats = dbHelpers.getAttendanceStats(user.id)
    const hasMarkedToday = dbHelpers.hasMarkedToday(user.id)

    return NextResponse.json({
      records,
      stats,
      hasMarkedToday,
    })
  } catch (error) {
    console.error('Get attendance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Mark attendance
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (dbHelpers.hasMarkedToday(user.id)) {
      return NextResponse.json(
        { error: 'Attendance already marked for today' },
        { status: 400 }
      )
    }

    const record = dbHelpers.markAttendance(user.id)

    return NextResponse.json({
      message: 'Attendance marked successfully',
      record,
    })
  } catch (error) {
    console.error('Mark attendance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
