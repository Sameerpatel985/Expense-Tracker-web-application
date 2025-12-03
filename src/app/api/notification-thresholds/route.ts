import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const thresholds = await prisma.notificationThreshold.findMany({
      where: { userId: session.user.id },
      include: {
        budget: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(thresholds)
  } catch (error) {
    console.error("Error fetching notification thresholds:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { budgetId, threshold, type, enabled = true } = await req.json()

    if (!budgetId || !threshold || !type) {
      return NextResponse.json(
        { error: "Budget ID, threshold, and type are required" },
        { status: 400 }
      )
    }

    if (threshold < 1 || threshold > 100) {
      return NextResponse.json(
        { error: "Threshold must be between 1 and 100" },
        { status: 400 }
      )
    }

    if (type && type !== 'email') {
      return NextResponse.json(
        { error: "Only email notifications are supported" },
        { status: 400 }
      )
    }

    // Verify the budget belongs to the user
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId: session.user.id,
      },
    })

    if (!budget) {
      return NextResponse.json(
        { error: "Budget not found" },
        { status: 404 }
      )
    }

    // Check if threshold already exists for this budget and type
    const existingThreshold = await prisma.notificationThreshold.findFirst({
      where: {
        budgetId,
        threshold,
        type,
        userId: session.user.id,
      },
    })

    if (existingThreshold) {
      return NextResponse.json(
        { error: "Notification threshold already exists for this budget and percentage" },
        { status: 400 }
      )
    }

    const notificationThreshold = await prisma.notificationThreshold.create({
      data: {
        budgetId,
        threshold,
        type,
        enabled,
        userId: session.user.id,
      },
      include: {
        budget: {
          include: {
            category: true,
          },
        },
      },
    })

    return NextResponse.json(notificationThreshold, { status: 201 })
  } catch (error) {
    console.error("Error creating notification threshold:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
