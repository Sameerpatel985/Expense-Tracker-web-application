import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  try {
    // Test password hashing consistency
    const testPassword = "test123"
    const hash = await bcrypt.hash(testPassword, 12)
    const isValid = await bcrypt.compare(testPassword, hash)

    // Get all users to see their email/password status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password: true, // Just to check if password exists
      },
    })

    // Check if passwords are properly hashed
    const userWithPasswordCheck = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
    }))

    const response = {
      bcryptWorking: isValid,
      totalUsers: users.length,
      users: userWithPasswordCheck,
      testHash: hash.substring(0, 20) + "... (truncated for security)",
      registrationUsesSaltRounds: 12,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json(
      { error: "Test failed", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
