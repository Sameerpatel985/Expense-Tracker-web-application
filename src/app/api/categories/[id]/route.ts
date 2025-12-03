import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const category = await prisma.category.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error fetching category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, color, icon } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      )
    }

    // Verify the category belongs to the user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Check if another category with the same name exists for this user
    const conflictingCategory = await prisma.category.findFirst({
      where: {
        name: name.toLowerCase(),
        userId: session.user.id,
        NOT: { id: resolvedParams.id },
      },
    })

    if (conflictingCategory) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      )
    }

    const category = await prisma.category.update({
      where: {
        id: resolvedParams.id,
      },
      data: {
        name: name.toLowerCase(),
        description,
        color,
        icon,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the category belongs to the user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    await prisma.category.delete({
      where: {
        id: resolvedParams.id,
      },
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
