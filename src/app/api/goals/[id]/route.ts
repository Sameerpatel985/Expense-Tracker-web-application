import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, targetAmount, currentAmount, targetDate, priority, status } = await req.json()

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
    const goal = await (prisma as any).goal.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    })

    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedGoal = await (prisma as any).goal.update({
      where: { id: resolvedParams.id },
      data: {
        title,
        description: description || null,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount !== undefined ? parseFloat(currentAmount) : goal.currentAmount,
        targetDate: new Date(targetDate),
        priority: priority || goal.priority,
        status: status || goal.status,
      },
    })

    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error("Error updating goal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const goal = await (prisma as any).goal.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    })

    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).goal.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: "Goal deleted successfully" })
  } catch (error) {
    console.error("Error deleting goal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
