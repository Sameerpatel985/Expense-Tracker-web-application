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

    const expense = await prisma.expense.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error fetching expense:", error)
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

    const { description, amount, date, categoryId } = await req.json()

    if (!description || !amount || !date || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify the expense belongs to the user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    // Verify the category belongs to the user
    const category = await prisma.category.findFirst({
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

    const expense = await prisma.expense.update({
      where: {
        id: resolvedParams.id,
      },
      data: {
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        categoryId,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error updating expense:", error)
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

    // Verify the expense belongs to the user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    await prisma.expense.delete({
      where: {
        id: resolvedParams.id,
      },
    })

    return NextResponse.json({ message: "Expense deleted successfully" })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
