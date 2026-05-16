import { NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/mock-data'
import { createToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { name, email, password, roomNumber } = await request.json()

    if (!name || !email || !password || !roomNumber) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = dbHelpers.findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Create new student user
    const newUser = dbHelpers.createUser({
      name,
      email,
      password, // In a real app, this would be hashed
      role: 'student',
      roomNumber,
    })

    const token = await createToken(newUser)
    await setAuthCookie(token)

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      message: 'Signup successful',
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
