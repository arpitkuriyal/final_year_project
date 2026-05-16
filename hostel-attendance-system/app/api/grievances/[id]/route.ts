import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { dbHelpers } from '@/lib/mock-data'

// PATCH - Update grievance (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { status, adminReply } = await request.json()

    const grievance = dbHelpers.updateGrievance(id, {
      ...(status && { status }),
      ...(adminReply && { adminReply }),
    })

    if (!grievance) {
      return NextResponse.json({ error: 'Grievance not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Grievance updated successfully',
      grievance,
    })
  } catch (error) {
    console.error('Update grievance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
