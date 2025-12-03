import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    console.log('🔍 Diagnosing login for:', email)

    const diagnostics = {
      step1_database_connection: 'UNKNOWN',
      step2_user_exists: false,
      step3_user_has_password: false,
      step4_password_hash_valid_format: false,
      step5_bcrypt_comparison: false,
      step6_auth_function_test: 'NOT_RUN',
      final_result: 'DIAGNOSIS_IN_PROGRESS'
    }

    // Step 1: Test database connection
    try {
      const userCount = await prisma.user.count()
      diagnostics.step1_database_connection = `SUCCESS - Found ${userCount} users`
      console.log('✅ Database connection:', diagnostics.step1_database_connection)
    } catch (error) {
      diagnostics.step1_database_connection = `FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`
      diagnostics.final_result = 'DATABASE_CONNECTION_FAILED'
      console.log('❌ Database connection failed:', diagnostics.step1_database_connection)
      return NextResponse.json(diagnostics)
    }

    // Step 2: Check if user exists
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
        }
      })

      if (user) {
        diagnostics.step2_user_exists = true
        console.log('✅ User exists:', user.email)
      } else {
        diagnostics.step2_user_exists = false
        diagnostics.final_result = 'USER_NOT_FOUND'
        console.log('❌ User not found')
      }
    } catch (error) {
      diagnostics.step2_user_exists = false
      diagnostics.final_result = 'USER_QUERY_FAILED'
      console.log('❌ User query failed:', error)
    }

    if (!user) {
      return NextResponse.json(diagnostics)
    }

    // Step 3: Check if user has password
    if (user.password) {
      diagnostics.step3_user_has_password = true
      console.log('✅ User has password hash')

      // Step 4: Check password hash format (bcrypt format starts with $2a$ or $2b$)
      const bcryptRegex = /^\$2[ab]\$.{56}$/
      diagnostics.step4_password_hash_valid_format = bcryptRegex.test(user.password)
      console.log('✅ Password hash format valid:', diagnostics.step4_password_hash_valid_format)

      if (diagnostics.step4_password_hash_valid_format) {
        // Step 5: Test bcrypt password comparison
        try {
          const isPasswordCorrect = await bcrypt.compare(password, user.password)
          diagnostics.step5_bcrypt_comparison = isPasswordCorrect
          console.log('✅ Password comparison result:', isPasswordCorrect ? 'CORRECT' : 'INCORRECT')

          if (isPasswordCorrect) {
            diagnostics.final_result = 'LOGIN_SHOULD_WORK'
          } else {
            diagnostics.final_result = 'PASSWORD_INCORRECT'
          }
        } catch (error) {
          console.log('❌ Bcrypt comparison failed:', error)
          diagnostics.step5_bcrypt_comparison = false
          diagnostics.final_result = 'BCRYPT_ERROR'
        }
      } else {
        diagnostics.final_result = 'INVALID_PASSWORD_HASH_FORMAT'
      }
    } else {
      diagnostics.step3_user_has_password = false
      diagnostics.final_result = 'USER_HAS_NO_PASSWORD'
      console.log('❌ User has no password')
    }

    // Step 6: Test NextAuth authorize function directly
    try {
      diagnostics.step6_auth_function_test = 'RUNNING'

      // Simulate what NextAuth authorize function does
      if (!email || !password) {
        diagnostics.step6_auth_function_test = 'FAILED_NULL_CREDENTIALS'
      } else if (!user || !user.password) {
        diagnostics.step6_auth_function_test = 'FAILED_NO_USER_PASSWORD'
      } else {
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
          diagnostics.step6_auth_function_test = 'FAILED_INVALID_PASSWORD'
        } else {
          diagnostics.step6_auth_function_test = 'SUCCESS_AUTHORIZED'
        }
      }
    } catch (error) {
      diagnostics.step6_auth_function_test = `FAILED_ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    console.log('📊 Final diagnosis:', diagnostics.final_result)

    return NextResponse.json({
      diagnostics,
      provided_email: email,
      provided_password_length: password.length,
      expected_flow: [
        '1. Database connection ✅',
        '2. User exists ✅',
        '3. User has password hash ✅',
        '4. Password hash is valid format ✅',
        '5. Bcrypt password comparison ✅',
        '6. NextAuth authorize function ✅'
      ]
    })

  } catch (error) {
    console.error("Diagnosis error:", error)
    return NextResponse.json(
      {
        diagnostics: {
          final_result: 'UNEXPECTED_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}
