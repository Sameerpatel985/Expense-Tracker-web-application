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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const budgets = await (prisma as any).budget.findMany({
      where: { userId: session.user.id },
      include: {
        category: true
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(budgets)
  } catch (error) {
    console.error("Error fetching budgets:", error)
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

    const { categoryId, amount, name, period = "monthly" } = await req.json()

    if (!categoryId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Category and valid amount are required" },
        { status: 400 }
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

    // Check if budget already exists for this category and user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingBudget = await (prisma as any).budget.findFirst({
      where: {
        categoryId,
        userId: session.user.id,
      },
    })

    if (existingBudget) {
      return NextResponse.json(
        { error: "Budget already exists for this category" },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const budget = await (prisma as any).budget.create({
      data: {
        categoryId,
        amount: parseFloat(amount),
        name: name || null,
        period,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error("Error creating budget:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
