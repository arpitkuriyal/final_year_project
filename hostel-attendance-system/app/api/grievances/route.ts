import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dbHelpers, type Grievance } from '@/lib/mock-data'

// GET - Get grievances
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let grievances: Grievance[]
    
    if (user.role === 'admin') {
      grievances = dbHelpers.getAllGrievances()
    } else {
      grievances = dbHelpers.getGrievancesByStudent(user.id)
    }

    const stats = dbHelpers.getGrievanceStats()

    return NextResponse.json({
      grievances,
      stats,
    })
  } catch (error) {
    console.error('Get grievances error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create grievance
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { category, description } = await request.json()

    if (!category || !description) {
      return NextResponse.json(
        { error: 'Category and description are required' },
        { status: 400 }
      )
    }

    const grievance = dbHelpers.createGrievance({
      studentId: user.id,
      studentName: user.name,
      roomNumber: user.roomNumber || 'N/A',
      category,
      description,
    })

    return NextResponse.json({
      message: 'Grievance submitted successfully',
      grievance,
    })
  } catch (error) {
    console.error('Create grievance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
