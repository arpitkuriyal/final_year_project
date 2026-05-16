import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dbHelpers } from '@/lib/mock-data'

// GET - Get all students (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const students = dbHelpers.getStudents().map(s => {
      const { password: _, ...studentWithoutPassword } = s
      const stats = dbHelpers.getAttendanceStats(s.id)
      const grievances = dbHelpers.getGrievancesByStudent(s.id)
      return {
        ...studentWithoutPassword,
        attendancePercentage: stats.percentage,
        totalGrievances: grievances.length,
        pendingGrievances: grievances.filter(g => g.status === 'pending').length,
      }
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
