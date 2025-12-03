import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const goals = await (prisma as any).goal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(goals)
  } catch (error) {
    console.error("Error fetching goals:", error)
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

    const { title, description, targetAmount, currentAmount = 0, targetDate, priority = "medium" } = await req.json()

    if (!title || !targetAmount || !targetDate) {
      return NextResponse.json(
        { error: "Title, target amount, and target date are required" },
        { status: 400 }
      )
    }

    if (targetAmount <= 0) {
      return NextResponse.json(
        { error: "Target amount must be greater than 0" },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const goal = await (prisma as any).goal.create({
      data: {
        title,
        description: description || null,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount),
        targetDate: new Date(targetDate),
        priority,
        userId: session.user.id,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error("Error creating goal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
