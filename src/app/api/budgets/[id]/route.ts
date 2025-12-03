/* eslint-disable @typescript-eslint/no-explicit-any */
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

    const budget = await (prisma as any).budget.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    })

    if (!budget) {
      return NextResponse.json(
        { error: "Budget not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(budget)
  } catch (error) {
    console.error("Error fetching budget:", error)
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

    const { categoryId, amount, name, period } = await req.json()

    if (!categoryId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Category and valid amount are required" },
        { status: 400 }
      )
    }

    // Verify the budget belongs to the user
    const existingBudget = await (prisma as any).budget.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    })

    if (!existingBudget) {
      return NextResponse.json(
        { error: "Budget not found" },
        { status: 404 }
      ) 
    }

    // Verify the category belongs to the user
    const category = await (prisma as any).category.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Check if another budget exists for this category (excluding current budget)
    const conflictingBudget = await (prisma as any).budget.findFirst({
      where: {
        categoryId,
        userId: session.user.id,
        NOT: { id: resolvedParams.id },
      },
    })

    if (conflictingBudget) {
      return NextResponse.json(
        { error: "Budget already exists for this category" },
        { status: 400 }
      )
    }

    const budget = await (prisma as any).budget.update({
      where: {
        id: resolvedParams.id,
      },
      data: {
        categoryId,
        amount: parseFloat(amount),
        name: name || null,
        period,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error("Error updating budget:", error)
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

    // Verify the budget belongs to the user
    const existingBudget = await (prisma as any).budget.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    })

    if (!existingBudget) {
      return NextResponse.json(
        { error: "Budget not found" },
        { status: 404 }
      )
    }

    await (prisma as any).budget.delete({
      where: {
        id: resolvedParams.id,
      },
    })

    return NextResponse.json({ message: "Budget deleted successfully" })
  } catch (error) {
    console.error("Error deleting budget:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
