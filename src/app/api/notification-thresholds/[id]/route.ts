import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { threshold, type, enabled } = await req.json()
    const { id: thresholdId } = await params

    // Verify the threshold belongs to the user
    const existingThreshold = await prisma.notificationThreshold.findFirst({
      where: {
        id: thresholdId,
        userId: session.user.id,
      },
    })

    if (!existingThreshold) {
      return NextResponse.json(
        { error: "Notification threshold not found" },
        { status: 404 }
      )
    }

    if (threshold !== undefined && (threshold < 1 || threshold > 100)) {
      return NextResponse.json(
        { error: "Threshold must be between 1 and 100" },
        { status: 400 }
      )
    }

    if (type !== undefined && type !== 'email') {
      return NextResponse.json(
        { error: "Only email notifications are supported" },
        { status: 400 }
      )
    }

    const updatedThreshold = await prisma.notificationThreshold.update({
      where: { id: thresholdId },
      data: {
        ...(threshold !== undefined && { threshold }),
        ...(type !== undefined && { type }),
        ...(enabled !== undefined && { enabled }),
      },
      include: {
        budget: {
          include: {
            category: true,
          },
        },
      },
    })

    return NextResponse.json(updatedThreshold)
  } catch (error) {
    console.error("Error updating notification threshold:", error)
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: thresholdId } = await params

    // Verify the threshold belongs to the user
    const existingThreshold = await prisma.notificationThreshold.findFirst({
      where: {
        id: thresholdId,
        userId: session.user.id,
      },
    })

    if (!existingThreshold) {
      return NextResponse.json(
        { error: "Notification threshold not found" },
        { status: 404 }
      )
    }

    await prisma.notificationThreshold.delete({
      where: { id: thresholdId },
    })

    return NextResponse.json({ message: "Notification threshold deleted successfully" })
  } catch (error) {
    console.error("Error deleting notification threshold:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
