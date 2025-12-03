import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    console.log('Debug login attempt for:', email)

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    })

    if (!user) {
      console.log('User not found:', email)
      return NextResponse.json({
        success: false,
        error: 'User not found',
        userExists: false,
        hasPassword: false,
        passwordLength: 0,
      })
    }

    console.log('User found:', user.id, 'Has password:', !!user.password)

    if (!user.password) {
      console.log('User has no password')
      return NextResponse.json({
        success: false,
        error: 'User has no password',
        userExists: true,
        hasPassword: false,
        passwordLength: 0,
      })
    }

    // Test password comparison
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    )

    console.log('Password comparison result:', isPasswordValid)

    // Test hash consistency by re-hashing the same password
    const rehashedPassword = await bcrypt.hash(password, 12)
    const isRehashValid = await bcrypt.compare(password, rehashedPassword)
    console.log('Rehash test:', isRehashValid)

    return NextResponse.json({
      success: isPasswordValid,
      error: isPasswordValid ? null : 'Invalid password',
      userExists: true,
      hasPassword: true,
      passwordLength: user.password.length,
      passwordStartsWith: user.password.substring(0, 7),
      bcryptWorking: isRehashValid,
      hashRounds: user.password.startsWith('$2a$12$') ? 12 : user.password.startsWith('$2a$10$') ? 10 : 'unknown',
    })

  } catch (error) {
    console.error("Debug login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
